import { useState, useCallback } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesChange: (images: { url: string; file: File }[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ onImagesChange, maxImages = 5 }: ImageUploadProps) => {
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    const newImages: { url: string; file: File }[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select only image files",
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Images must be smaller than 5MB",
          variant: "destructive",
        });
        continue;
      }

      const url = URL.createObjectURL(file);
      newImages.push({ url, file });
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  }, [images, maxImages, onImagesChange, toast]);

  const removeImage = useCallback((index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(images[index].url);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      <Label htmlFor="images">Images (optional)</Label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image.url}
              alt={`Upload ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
                Primary
              </div>
            )}
          </div>
        ))}
        
        {images.length < maxImages && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-32 flex flex-col items-center justify-center hover:border-muted-foreground/50 transition-colors">
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Label
              htmlFor="images"
              className="cursor-pointer flex flex-col items-center justify-center h-full w-full"
            >
              <Image className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Add Image</span>
            </Label>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Upload up to {maxImages} images. First image will be used as the primary image.
      </p>
    </div>
  );
};