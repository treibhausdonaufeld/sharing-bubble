import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, CheckCircle, Loader, SkipForward, Sparkles, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ImageManager } from './ImageManager';

interface ImageUploadStepProps {
  onComplete: (data: {
    images: { url: string; file: File }[];
    skipAI?: boolean;
    skipImages?: boolean;
    aiGeneratedData?: {
      title?: string;
      description?: string;
    };
    tempItemId?: string;
  }) => void;
  onBack: () => void;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const ImageUploadStep = ({ onComplete, onBack }: ImageUploadStepProps) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  // Only need job creation now
  const { createProcessingJob } = useImageProcessing();
  const { user } = useAuth(); // Use the auth context instead
  
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [tempItemId, setTempItemId] = useState<string | null>(null);
  // Track the created job and uploaded images for retries
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadedImagesState, setUploadedImagesState] = useState<{ url: string; file: File }[]>([]);

  const handleSkipImages = () => {
    onComplete({ images: [], skipImages: true });
  };

  const handleSkipAI = () => {
    if (images.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image or skip image upload entirely.",
        variant: "destructive",
      });
      return;
    }
    onComplete({ images, skipAI: true });
  };

  const uploadImagesToStorage = useCallback(async (itemId: string) => {
    const uploadedImages: { url: string; file: File }[] = [];
    
    for (const image of images) {
      try {
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${itemId}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(fileName, image.file);

        if (error) throw error;

        const { data: publicUrl } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        uploadedImages.push({
          url: publicUrl.publicUrl,
          file: image.file
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
    
    return uploadedImages;
  }, [images]);

  const invokeAI = useCallback(
    async (jobIdArg: string, primaryImageUrl: string) => {
      const { data, error } = await supabase.functions.invoke('generate-item-content', {
        body: {
          jobId: jobIdArg,
          primaryImageUrl,
          userLanguage: language,
        },
      });

      if (error) {
        throw error;
      }
      if (!data?.success) {
        throw new Error(data?.details || 'AI function did not return success');
      }

      return {
        title: data.aiGeneratedTitle as string,
        description: data.aiGeneratedDescription as string,
      };
    },
    [language]
  );

  const handleProceedWithAI = async () => {
    if (images.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image to use AI processing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingState('uploading');
      setProgress(10);
      
      // Generate client-side item ID
      const tempId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { error: itemError } = await supabase
        .from('items')
        .insert({
          id: tempId,
          title: tempId,
          user_id: user.id,
          description: 'empty',
          category: 'other',
          condition: 'used',
          listing_type: 'sell',
          status: 'draft'
        });

      if (itemError) throw itemError;

      setTempItemId(tempId);
      setProgress(30);

      // Upload images to storage
      const uploadedImages = await uploadImagesToStorage(tempId);
      setUploadedImagesState(uploadedImages);
      setProgress(50);

      // Create processing job (stores images + context in DB)
      setProcessingState('processing');
      const job = await createProcessingJob(tempId, uploadedImages, language);
      if (!job?.id) throw new Error('Failed to create processing job');
      setJobId(job.id);

      // Call AI function directly and await result
      setProgress(70);
      const aiData = await invokeAI(job.id, uploadedImages[0].url);

      setProcessingState('completed');
      setProgress(100);

      toast({
        title: "Processing Complete!",
        description: "AI has analyzed your images and generated suggestions.",
      });

      // Auto-proceed after showing results
      setTimeout(() => {
        onComplete({ 
          images: uploadedImages, 
          aiGeneratedData: aiData,
          tempItemId: tempId
        });
      }, 800);

    } catch (error) {
      console.error('Error in AI processing:', error);
      setProcessingState('error');
      toast({
        title: "Processing Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetryAI = async () => {
    if (!tempItemId || !jobId || uploadedImagesState.length === 0) {
      toast({
        title: "Retry Unavailable",
        description: "No previous processing job found to retry.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingState('processing');
      setProgress(60);

      const aiData = await invokeAI(jobId, uploadedImagesState[0].url);

      setProcessingState('completed');
      setProgress(100);

      toast({
        title: "Processing Complete!",
        description: "AI has analyzed your images and generated suggestions.",
      });

      setTimeout(() => {
        onComplete({ 
          images: uploadedImagesState, 
          aiGeneratedData: aiData,
          tempItemId
        });
      }, 800);

    } catch (error) {
      console.error('Retry AI error:', error);
      setProcessingState('error');
      toast({
        title: "Retry Failed",
        description: "Could not restart AI processing.",
        variant: "destructive",
      });
    }
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case 'uploading':
        return 'Uploading images to storage...';
      case 'processing':
        return 'AI is analyzing your images and generating content...';
      case 'completed':
        return 'Processing complete!';
      case 'error':
        return 'An error occurred during processing.';
      default:
        return '';
    }
  };

  const isProcessing = processingState === 'uploading' || processingState === 'processing';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Item Images
          </CardTitle>
          <p className="text-muted-foreground">
            Upload photos of your item. Our AI will analyze them to suggest a title and description.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageManager 
            onImagesChange={setImages}
            onExistingImagesChange={() => {}}
            existingImages={[]}
            maxImages={8}
          />

          {images.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {images.length} image{images.length !== 1 ? 's' : ''} uploaded
              </Badge>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{getProcessingMessage()}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* AI Generated Preview */}
          {processingState === 'completed' && aiGeneratedData.title && (
            <div className="space-y-3 p-4 bg-gradient-warm/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">AI Generated Suggestions</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Suggested Title:</p>
                  <p className="text-sm font-medium">{aiGeneratedData.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Suggested Description:</p>
                  <p className="text-sm">{aiGeneratedData.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!isProcessing && processingState !== 'completed' && processingState !== 'error' && (
              <>
                <Button 
                  onClick={handleProceedWithAI}
                  disabled={images.length === 0}
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Continue with AI Processing
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSkipAI}
                    disabled={images.length === 0}
                    className="flex-1 gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    Skip AI, Continue Manually
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleSkipImages}
                    className="flex-1 gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Skip Images Entirely
                  </Button>
                </div>
              </>
            )}

            {processingState === 'completed' && (
              <div className="text-center text-sm text-muted-foreground">
                Proceeding to item details...
              </div>
            )}

            {processingState === 'error' && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetryAI}
                  disabled={!tempItemId}
                  className="flex-1 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Retry AI Processing
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkipAI}
                  disabled={images.length === 0}
                  className="flex-1 gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Continue Manually
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};