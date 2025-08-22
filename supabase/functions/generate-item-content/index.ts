import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"; // + add this
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY")!;

    if (!geminiApiKey) {
      throw new Error("Google Gemini API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { jobId, primaryImageUrl, userLanguage = "en" } = await req.json();

    if (!jobId || !primaryImageUrl) {
      throw new Error("Job ID and primary image URL are required");
    }

    console.log(
      `Generating AI content for job: ${jobId} with image: ${primaryImageUrl} in language: ${userLanguage}`,
    );

    // Get the processing job
    const { data: job, error: jobError } = await supabase
      .from("item_processing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Helpers to work with Supabase Storage URLs in local dev
    const parsePublicStorageUrl = (imageUrl: string):
      | { bucket: string; path: string }
      | null => {
      try {
        const u = new URL(imageUrl);
        const marker = "/storage/v1/object/public/";
        const idx = u.pathname.indexOf(marker);
        if (idx !== -1) {
          const after = u.pathname.substring(idx + marker.length);
          const [bucket, ...rest] = after.split("/");
          const path = decodeURIComponent(rest.join("/"));
          return { bucket, path };
        }
        return null;
      } catch {
        return null;
      }
    };

    const addTransformParams = (url: string): string => {
      try {
        const u = new URL(url);
        u.searchParams.delete("width");
        u.searchParams.delete("height");
        u.searchParams.delete("resize");
        u.searchParams.delete("quality");
        u.searchParams.set("width", "1200");
        u.searchParams.set("quality", "85");
        return u.toString();
      } catch {
        return url;
      }
    };

    const rewriteLocalhostToKong = (url: string): string => {
      try {
        const u = new URL(url);
        if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
          // Route through the local Supabase gateway inside Docker
          u.hostname = "kong";
          if (!u.port) u.port = "8000";
        }
        return u.toString();
      } catch {
        return url;
      }
    };

    // Prefer a signed URL (works even if the bucket/object isn’t public)
    let fetchUrl: string | null = null;
    const parsed = parsePublicStorageUrl(primaryImageUrl);

    if (parsed) {
      const { bucket, path } = parsed;
      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60); // 60s is enough for one fetch

      if (!signErr && signed?.signedUrl) {
        fetchUrl = addTransformParams(signed.signedUrl);
      } else {
        // Fallback to the provided URL with transform params
        fetchUrl = addTransformParams(primaryImageUrl);
      }
    } else {
      // Non-Supabase URL; just append transform params (may be ignored)
      fetchUrl = addTransformParams(primaryImageUrl);
    }

    fetchUrl = rewriteLocalhostToKong(fetchUrl);

    console.log("Downloading transformed image (<=1200w) from:", fetchUrl);
    const imageResponse = await fetch(fetchUrl);
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => "");
      throw new Error(
        `Failed to download image: ${imageResponse.status} ${imageResponse.statusText} ${errorText}`,
      );
    }

    // Use Deno std base64 encoder to avoid stack overflow on large images
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8 = new Uint8Array(imageBuffer);
    const base64Image = base64Encode(uint8); // replaced btoa(String.fromCharCode(...))

    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Generate AI content using Google Gemini
    console.log("Calling Google Gemini API...");
    const aiContent = await generateAIContent(
      base64Image,
      mimeType,
      userLanguage,
      geminiApiKey,
    );

    console.log(`Generated title: ${aiContent.title}`);
    console.log(`Generated description: ${aiContent.description}`);

    // Update the job with AI-generated content
    await supabase
      .from("item_processing_jobs")
      .update({
        ai_generated_title: aiContent.title,
        ai_generated_description: aiContent.description,
        status: "completed",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`AI content generation completed for job: ${jobId}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        aiGeneratedTitle: aiContent.title,
        aiGeneratedDescription: aiContent.description,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-item-content function:", error);

    // Update job status to failed
    try {
      const body = await req.clone().json();
      const { jobId } = body;

      if (jobId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceRoleKey = Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY",
        )!;
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        await supabase
          .from("item_processing_jobs")
          .update({
            status: "failed",
            error_message: error instanceof Error
              ? error.message
              : "AI content generation failed",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
    } catch (updateError) {
      console.error("Error updating job status:", updateError);
    }

    return new Response(
      JSON.stringify({
        error: "AI content generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

async function generateAIContent(
  base64Image: string,
  mimeType: string,
  userLanguage: string,
  apiKey: string,
) {
  const languageInstructions = getLanguageInstructions(userLanguage);

  const prompt = `${languageInstructions}

Analyze this image of an item that someone wants to list for sale or rent. Generate:

1. A concise, appealing title (max 60 characters)
2. A detailed description (100-200 words) that includes:
   - What the item is
   - Its condition and notable features
   - Potential uses or benefits
   - Any visible details that make it appealing

Be descriptive but honest. Focus on what you can actually see in the image.

Format your response as JSON:
{
  "title": "your generated title",
  "description": "your generated description"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: prompt,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error("No content generated by Gemini API");
  }

  const generatedText = result.candidates[0].content.parts[0].text;
  console.log("Raw Gemini response:", generatedText);

  try {
    // Try to parse JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsedContent = JSON.parse(jsonMatch[0]);

    if (!parsedContent.title || !parsedContent.description) {
      throw new Error("Missing title or description in response");
    }

    return {
      title: parsedContent.title.substring(0, 60), // Ensure max length
      description: parsedContent.description,
    };
  } catch (parseError) {
    console.error("Error parsing Gemini response:", parseError);

    // Fallback: extract title and description from unstructured text
    const lines = generatedText.split("\n").filter((line: string) =>
      line.trim()
    );
    const title = lines[0]?.replace(/^title:?\s*/i, "").substring(0, 60) ||
      "Quality Item";
    const description = lines.slice(1).join(" ") ||
      "A quality item in good condition.";

    return { title, description };
  }
}

function getLanguageInstructions(language: string): string {
  const instructions = {
    en: "Please respond in English.",
    es: "Por favor responde en español.",
    fr: "Veuillez répondre en français.",
    de: "Bitte antworten Sie auf Deutsch.",
    it: "Si prega di rispondere in italiano.",
    pt: "Por favor responda em português.",
    nl: "Gelieve te antwoorden in het Nederlands.",
    ru: "Пожалуйста, отвечайте на русском языке.",
    ja: "日本語でお答えください。",
    ko: "한국어로 답변해 주세요.",
    zh: "请用中文回答。",
    ar: "يرجى الرد باللغة العربية.",
    hi: "कृपया हिंदी में उत्तर दें।",
  };

  return instructions[language as keyof typeof instructions] || instructions.en;
}
