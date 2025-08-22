import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useCallback, useState } from "react";

type ProcessingJob =
  Database["public"]["Tables"]["item_processing_jobs"]["Row"];

export const useImageProcessing = () => {
  const { toast } = useToast();
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const createProcessingJob = useCallback(
    async (
      itemId: string,
      images: { url: string; file: File }[],
      userLanguage = "en"
    ) => {
      try {
        setIsProcessing(true);

        const originalImages = images.map((img) => img.url);

        const { data, error } = await supabase
          .from("item_processing_jobs")
          .insert({
            item_id: itemId,
            status: "pending",
            original_images: originalImages,
          })
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        setProcessingJobs((prev) => [...prev, data]);

        // Trigger AI content generation immediately (skip thumbnail processing)
        const primaryImageUrl = originalImages[0];
        await triggerContentGeneration(data.id, primaryImageUrl, userLanguage);

        return data;
      } catch (error) {
        console.error("Error creating processing job:", error);
        toast({
          title: "Processing Error",
          description: "Failed to start image processing.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

  const triggerContentGeneration = useCallback(
    async (jobId: string, primaryImageUrl: string, userLanguage = "en") => {
      try {
        const { error } = await supabase.functions.invoke(
          "generate-item-content",
          {
            body: { jobId, primaryImageUrl, userLanguage },
          }
        );
        if (error) throw error;
      } catch (error) {
        console.error("Error triggering content generation:", error);
        // Update job status to failed
        await supabase
          .from("item_processing_jobs")
          .update({
            status: "failed",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", jobId);
      }
    },
    []
  );

  const getProcessingJob = useCallback(async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from("item_processing_jobs")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching processing job:", error);
      return null;
    }
  }, []);

  const retryContentGeneration = useCallback(async (itemId: string, userLanguage = 'en') => {
    // Fetch latest job for the item
    const job = await getProcessingJob(itemId);
    if (!job) {
      throw new Error('No processing job found to retry');
    }
    const primaryImageUrl = (job.original_images as string[] | null)?.[0];
    if (!primaryImageUrl) {
      throw new Error('No original images available for retry');
    }

    // Mark as processing again
    await supabase
      .from('item_processing_jobs')
      .update({
        status: 'processing',
        error_message: null,
        processing_started_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Invoke content generation
    const { error } = await supabase.functions.invoke('generate-item-content', {
      body: { jobId: job.id, primaryImageUrl, userLanguage }
    });
    if (error) throw error;
  }, [getProcessingJob]);

  const subscribeToProcessingUpdates = useCallback((itemId: string, callback: (job: ProcessingJob) => void) => {
    const channel = supabase
      .channel(`processing-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_processing_jobs',
          filter: `item_id=eq.${itemId}`
        },
        async (payload) => {
          if (payload.new) {
            callback(payload.new as ProcessingJob);
          } else {
            // Fallback: fetch latest job when new row data isn't present
            const latest = await getProcessingJob(itemId);
            if (latest) callback(latest as ProcessingJob);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getProcessingJob]);

  return {
    processingJobs,
    isProcessing,
    createProcessingJob,
    getProcessingJob,
  subscribeToProcessingUpdates,
  retryContentGeneration
  };
};
