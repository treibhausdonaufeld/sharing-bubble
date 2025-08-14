import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, Loader, Sparkles, SkipForward, ArrowRight } from 'lucide-react';
import { ImageManager } from './ImageManager';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadStepProps {
  onComplete: (data: {
    images: { url: string; file: File }[];
    skipAI?: boolean;
    skipImages?: boolean;
    aiGeneratedData?: {
      title?: string;
      description?: string;
    };
  }) => void;
  onBack: () => void;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const ImageUploadStep = ({ onComplete, onBack }: ImageUploadStepProps) => {
  const { toast } = useToast();
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    title?: string;
    description?: string;
  }>({});

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

  const handleProceedWithAI = async () => {
    if (images.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image to use AI processing.",
        variant: "destructive",
      });
      return;
    }

    setProcessingState('uploading');
    setProgress(20);

    // Simulate processing steps
    setTimeout(() => {
      setProcessingState('processing');
      setProgress(60);
      
      // Simulate AI processing
      setTimeout(() => {
        setProcessingState('completed');
        setProgress(100);
        
        // Simulate AI-generated content
        setAiGeneratedData({
          title: "Beautiful Item", // Placeholder - will be replaced with actual AI
          description: "A wonderful item with great features and excellent condition." // Placeholder
        });

        toast({
          title: "Processing Complete!",
          description: "AI has analyzed your images and generated suggestions.",
        });

        // Auto-proceed after showing results
        setTimeout(() => {
          onComplete({ 
            images, 
            aiGeneratedData: {
              title: aiGeneratedData.title,
              description: aiGeneratedData.description
            }
          });
        }, 2000);
      }, 3000);
    }, 2000);
  };

  const getProcessingMessage = () => {
    switch (processingState) {
      case 'uploading':
        return 'Uploading images and creating thumbnails...';
      case 'processing':
        return 'AI is analyzing your images...';
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};