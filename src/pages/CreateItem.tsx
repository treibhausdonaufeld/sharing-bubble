import { ImageUploadStep } from '@/components/items/ImageUploadStep';
import { ItemDetailsStep, ItemFormData } from '@/components/items/ItemDetailsStep';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type WizardStep = 'images' | 'details';

interface WizardData {
  images: { url: string; file: File }[];
  aiGeneratedData?: {
    title?: string;
    description?: string;
  category?: string;
  condition?: string;
  listing_type?: string;
  sale_price?: number | null;
  };
  skipAI?: boolean;
  skipImages?: boolean;
  tempItemId?: string;
}

const CreateItem = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState<WizardStep>('images');
  const [wizardData, setWizardData] = useState<WizardData>({
    images: []
  });
  const [loading, setLoading] = useState(false);

  const getStepProgress = () => {
    switch (currentStep) {
      case 'images':
        return 50;
      case 'details':
        return 100;
      default:
        return 0;
    }
  };

  const handleImageStepComplete = (data: WizardData) => {
    setWizardData(prev => ({ ...prev, ...data }));
    setCurrentStep('details');
  };

  const updateImageRecords = async (oldItemId: string, newItemId: string) => {
    if (!wizardData.images || wizardData.images.length === 0) return;

    // Update existing image records to point to the new item
    const { error } = await supabase
      .from('item_images')
      .update({ item_id: newItemId })
      .eq('item_id', oldItemId);

    if (error) throw error;
  };

  const handleDetailsComplete = async (formData: ItemFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to list an item.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Use AI-generated data if available, otherwise use form data
      const finalTitle = wizardData.aiGeneratedData?.title || formData.title;
      const finalDescription = wizardData.aiGeneratedData?.description || formData.description;

      const itemData = {
        user_id: user.id,
        title: finalTitle,
        description: finalDescription,
        category: formData.category as Database['public']['Enums']['item_category'],
        condition: formData.condition as Database['public']['Enums']['item_condition'],
        listing_type: formData.listing_type as Database['public']['Enums']['listing_type'],
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        rental_price: formData.rental_price ? parseFloat(formData.rental_price) : null,
        rental_period: formData.rental_period as Database['public']['Enums']['rental_period'] || null,
        status: 'available' as Database['public']['Enums']['item_status']
      };

      // Create the final item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert(itemData)
        .select()
        .single();

      if (itemError) throw itemError;

      // Create ownership record
      const { error: ownerError } = await supabase
        .from('item_owners')
        .insert({
          item_id: item.id,
          user_id: user.id,
          role: 'owner'
        });

      if (ownerError) throw ownerError;

      // If we have a temporary item from AI processing, transfer its data
      if (wizardData.tempItemId) {
        // Update image records to point to the new item
        await updateImageRecords(wizardData.tempItemId, item.id);
        
        // Update processing job to point to the new item
        await updateProcessingJob(wizardData.tempItemId, item.id);
        
        // Delete the temporary item
        await supabase
          .from('items')
          .delete()
          .eq('id', wizardData.tempItemId);
      }

      toast({
        title: "Success",
        description: "Item listed successfully!",
      });

      // Navigate to item detail view
      navigate(`/item/${item.id}`);
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('images');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header with Back Button */}
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">List New Item</h1>
              <span className="text-sm text-muted-foreground">
                Step {currentStep === 'images' ? '1' : '2'} of 2
              </span>
            </div>
            <Progress value={getStepProgress()} className="w-full" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${currentStep === 'images' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 'images' ? 'bg-primary text-primary-foreground' : 
                currentStep === 'details' ? 'bg-success text-success-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                {currentStep === 'details' ? '✓' : '1'}
              </div>
              Upload Images
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              Item Details
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 'images' && (
            <ImageUploadStep 
              onComplete={handleImageStepComplete}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 'details' && (
            <ItemDetailsStep 
              onComplete={handleDetailsComplete}
              onBack={handleBack}
              images={wizardData.images}
              aiGeneratedData={wizardData.aiGeneratedData}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateItem;