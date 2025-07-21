import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Image, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExistingImage {
  id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface NewImage {
  url: string;
  file: File;
}

interface ImageManagerProps {
  onImagesChange: (newImages: NewImage[]) => void;
  onExistingImagesChange?: (existingImages: ExistingImage[]) => void;
  existingImages?: ExistingImage[];
  maxImages?: number;
  isEditing?: boolean;
}

export const ImageManager = ({ 
  onImagesChange, 
  onExistingImagesChange,
  existingImages = [],
  maxImages = 5,
  isEditing = false
}: ImageManagerProps) => {
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [currentExistingImages, setCurrentExistingImages] = useState<ExistingImage[]>(existingImages);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentExistingImages(existingImages);
  }, [existingImages]);

  const totalImages = currentExistingImages.length + newImages.length;

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (totalImages + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    const validNewImages: NewImage[] = [];
    
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
      validNewImages.push({ url, file });
    }

    const updatedNewImages = [...newImages, ...validNewImages];
    setNewImages(updatedNewImages);
    onImagesChange(updatedNewImages);
  }, [newImages, totalImages, maxImages, onImagesChange, toast]);

  const removeNewImage = useCallback((index: number) => {
    const updatedImages = newImages.filter((_, i) => i !== index);
    setNewImages(updatedImages);
    onImagesChange(updatedImages);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(newImages[index].url);
  }, [newImages, onImagesChange]);

  const removeExistingImage = useCallback(async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('item_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      const updatedExistingImages = currentExistingImages.filter(img => img.id !== imageId);
      
      // Reorder remaining images and update primary
      const reorderedImages = updatedExistingImages.map((img, index) => ({
        ...img,
        display_order: index,
        is_primary: index === 0
      }));

      setCurrentExistingImages(reorderedImages);
      onExistingImagesChange?.(reorderedImages);

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  }, [currentExistingImages, onExistingImagesChange, toast]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reorderedImages = [...currentExistingImages];
    const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);

    // Update display_order and primary status
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      display_order: index,
      is_primary: index === 0
    }));

    setCurrentExistingImages(updatedImages);
    setDraggedIndex(null);

    // Update in database
    try {
      const updatePromises = updatedImages.map(img =>
        supabase
          .from('item_images')
          .update({
            display_order: img.display_order,
            is_primary: img.is_primary
          })
          .eq('id', img.id)
      );

      await Promise.all(updatePromises);
      onExistingImagesChange?.(updatedImages);

      toast({
        title: "Success",
        description: "Images reordered successfully",
      });
    } catch (error) {
      console.error('Error reordering images:', error);
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
    }
  };

  // Combine and sort all images for display
  const allImages = [
    ...currentExistingImages.map((img, index) => ({ type: 'existing' as const, data: img, index })),
    ...newImages.map((img, index) => ({ type: 'new' as const, data: img, index: currentExistingImages.length + index }))
  ].sort((a, b) => a.index - b.index);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Images {isEditing && "(drag to reorder)"}</Label>
        <Badge variant="secondary">
          {totalImages} / {maxImages}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {allImages.map((item, displayIndex) => (
          <div
            key={item.type === 'existing' ? item.data.id : `new-${item.index}`}
            className="relative group"
            draggable={item.type === 'existing' && isEditing}
            onDragStart={() => item.type === 'existing' && handleDragStart(displayIndex)}
            onDragOver={handleDragOver}
            onDrop={(e) => item.type === 'existing' && handleDrop(e, displayIndex)}
          >
            <img
              src={item.type === 'existing' ? item.data.image_url : item.data.url}
              alt={`Image ${displayIndex + 1}`}
              className="w-full h-32 object-cover rounded-lg border cursor-pointer"
            />
            
            {/* Drag Handle for existing images */}
            {item.type === 'existing' && isEditing && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white bg-black/50 rounded p-0.5" />
              </div>
            )}
            
            {/* Delete Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (item.type === 'existing') {
                  removeExistingImage(item.data.id);
                } else {
                  removeNewImage(item.index - currentExistingImages.length);
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Primary Badge */}
            {displayIndex === 0 && (
              <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
                Primary
              </Badge>
            )}
          </div>
        ))}
        
        {/* Add New Image Button */}
        {totalImages < maxImages && (
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
        Upload up to {maxImages} images. The first image will be used as the primary image.
        {isEditing && " Drag images to reorder them."}
      </p>
    </div>
  );
};