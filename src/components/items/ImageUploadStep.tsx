import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, CheckCircle, Loader, SkipForward, Sparkles, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageManager } from './ImageManager';

interface ImageUploadStepProps {
  onBack: () => void;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const ImageUploadStep = ({ onBack }: ImageUploadStepProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null); // retained if future timeout needed
  const intervalRef = useRef<number | null>(null); // retained for progress animation
  const navigatedRef = useRef(false);

  const handleSkipImages = () => {
    createDraftAndNavigate(false);
  };

  const uploadImagesToStorage = useCallback(async (itemId: string, imagesToUpload: { url: string; file: File }[]) => {
    const uploadedImages: { url: string; file: File }[] = [];

    for (let i = 0; i < imagesToUpload.length; i++) {
      const image = imagesToUpload[i];
      try {
        const fileExt = image.file.name.split('.').pop();
        const fileName = `${itemId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('item-images')
          .upload(fileName, image.file);

        if (uploadErr) throw uploadErr;

        const { data: publicUrl } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        const imageUrl = publicUrl.publicUrl;

        // Insert DB record for this image
        const { error: insertErr } = await supabase
          .from('item_images')
          .insert({
            item_id: itemId,
            image_url: imageUrl,
            is_primary: i === 0,
            display_order: i,
          });

        if (insertErr) throw insertErr;

        uploadedImages.push({ url: imageUrl, file: image.file });
      } catch (error) {
        console.error('Error uploading/saving image:', error);
        throw error;
      }
    }

    return uploadedImages;
  }, [images]);

  const createDraftAndNavigate = useCallback(async (withAI: boolean) => {
    if (images.length === 0 && withAI) {
      toast({
        title: "No Images",
        description: "Please upload at least one image to use AI processing.",
        variant: "destructive",
      });
      return;
    }

    setProcessingState('uploading');
    setProgress(10);

    try {
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          user_id: user!.id,
          title: 'New Draft Item',
          description: '',
          category: 'other',
          condition: 'used',
          listing_type: 'sell',
          status: 'draft'
        })
        .select('id')
        .single();

      if (itemError) throw itemError;
      const newItemId = item.id;

      setProgress(30);

      const uploadedImages = await uploadImagesToStorage(newItemId, images);
      setProgress(50);

      if (withAI && uploadedImages.length > 0) {
        setProcessingState('processing');
        setProgress(65);
        setActiveItemId(newItemId); // keeps UI in sync, but don't rely on it for immediate navigation
        toast({
          title: 'Item created',
            description: 'Generating AI content…',
        });

        try {
          // Light progress animation while waiting (65 -> 90)
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          intervalRef.current = window.setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + 1 : prev));
          }, 600);

          const primaryImageUrl = uploadedImages[0].url;
          const { data: aiData, error: invokeError } = await supabase.functions.invoke('generate-item-content', {
            body: { itemId: newItemId, primaryImageUrl, userLanguage: language }
          });

          if (invokeError || !aiData?.success) {
            console.error('AI generation failed:', invokeError || aiData);
            toast({
              title: 'AI Failed',
              description: 'Continuing without AI suggestions.',
              variant: 'destructive'
            });
            handleAICompletion('failed', newItemId);
          } else {
            handleAICompletion('completed', newItemId);
          }
        } catch (err) {
          console.error('AI invocation exception:', err);
          toast({
            title: 'AI Error',
            description: 'Opening editor so you can fill details manually.',
            variant: 'destructive'
          });
          handleAICompletion('failed', newItemId);
        }
        return; // stop normal navigation; handleAICompletion will navigate
      }

      // Non-AI path: navigate immediately
      toast({
        title: "Item created",
        description: "Redirecting to edit your item details...",
      });
      navigate(`/edit-item/${newItemId}`);

    } catch (error) {
      console.error('Error creating draft item:', error);
      setProcessingState('error');
      toast({
        title: "Error",
        description: "Failed to create draft item. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, images, language, uploadImagesToStorage, navigate, toast]);

  const handleSkipAI = () => {
    createDraftAndNavigate(false);
  };

  const handleProceedWithAI = () => {
    createDraftAndNavigate(true);
  };

  const cleanupTimers = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleAICompletion = (reason: 'completed' | 'failed' | 'timeout', itemId?: string) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    cleanupTimers();
    setProgress(100);
    setProcessingState('completed');
    if (reason === 'completed') {
      toast({
        title: 'AI Ready',
        description: 'Content generated. Opening details...',
      });
    } else if (reason === 'timeout') {
      toast({
        title: 'Taking Longer',
        description: 'Opening editor while AI finishes in background.',
      });
    } else {
      toast({
        title: 'AI Failed',
        description: 'Opening editor so you can fill details manually.',
        variant: 'destructive'
      });
    }
    const targetId = itemId || activeItemId;
    if (targetId) navigate(`/edit-item/${targetId}`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

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
              {processingState === 'processing' && activeItemId && (
                <p className="text-xs text-muted-foreground">Generating AI content…</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!isProcessing && processingState !== 'completed' && (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};