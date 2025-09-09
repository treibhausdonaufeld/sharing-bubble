import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/integrations/supabase/types';
import { Edit3, Save, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ItemDetailsStepProps {
  onComplete: (formData: ItemFormData) => void;
  onBack: () => void;
  images: { url: string; file: File }[];
  aiGeneratedData?: {
    title?: string;
    description?: string;
  category?: string;
  condition?: string;
  listing_type?: string;
  sale_price?: number | null;
  };
  isLoading?: boolean;
}

export interface ItemFormData {
  title: string;
  description: string;
  category: Database['public']['Enums']['item_category'] | '';
  condition: Database['public']['Enums']['item_condition'] | '';
  listing_type: Database['public']['Enums']['listing_type'] | '';
  sale_price: string;
  rental_price: string;
  rental_period: Database['public']['Enums']['rental_period'] | '';
}

export const ItemDetailsStep = ({ 
  onComplete, 
  onBack, 
  images, 
  aiGeneratedData,
  isLoading 
}: ItemDetailsStepProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    description: '',
    category: '',
    condition: '',
    listing_type: '',
    sale_price: '',
    rental_price: '',
    rental_period: ''
  });

  const categories = [
    'electronics', 'furniture', 'clothing', 'books', 'sports', 
    'tools', 'kitchen', 'garden', 'toys', 'vehicles', 'rooms', 'other'
  ];

  const conditions = ['new', 'used', 'broken'];
  const listingTypes = ['sell', 'rent', 'both'];
  const rentalPeriods = ['hourly', 'daily', 'weekly'];

  // Pre-populate with AI-generated data
  useEffect(() => {
    if (aiGeneratedData && (aiGeneratedData.title || aiGeneratedData.description)) {
      setFormData(prev => ({
        ...prev,
        title: aiGeneratedData.title || prev.title,
        description: aiGeneratedData.description || prev.description,
        category: (aiGeneratedData.category as any) || prev.category,
        condition: (aiGeneratedData.condition as any) || prev.condition,
        listing_type: (aiGeneratedData.listing_type as any) || prev.listing_type,
        sale_price: typeof aiGeneratedData.sale_price === 'number'
          ? aiGeneratedData.sale_price.toFixed(2)
          : prev.sale_price,
      }));
    }
  }, [aiGeneratedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.category || !formData.condition || !formData.listing_type) {
      return;
    }

    onComplete(formData);
  };

  const hasAiData = aiGeneratedData?.title || aiGeneratedData?.description;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Item Details
          </CardTitle>
          {hasAiData && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI suggestions applied
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('editItem.itemName')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter item title"
                required
                className={hasAiData && aiGeneratedData?.title ? 'border-accent/50' : ''}
              />
              {hasAiData && aiGeneratedData?.title && (
                <p className="text-xs text-accent">✨ AI suggested this title</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('editItem.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('editItem.descriptionPlaceholder')}
                rows={4}
                className={hasAiData && aiGeneratedData?.description ? 'border-accent/50' : ''}
              />
              {hasAiData && aiGeneratedData?.description && (
                <p className="text-xs text-accent">✨ AI suggested this description</p>
              )}
            </div>

            {/* Category and Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('editItem.selectCategory')} *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    category: value as Database['public']['Enums']['item_category']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('editItem.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`category.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('editItem.selectCondition')} *</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    condition: value as Database['public']['Enums']['item_condition']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('editItem.selectCondition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {t(`condition.${condition}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Listing Type */}
            <div className="space-y-2">
              <Label>Listing Type *</Label>
              <Select 
                value={formData.listing_type} 
                onValueChange={(value) => setFormData({
                  ...formData, 
                  listing_type: value as Database['public']['Enums']['listing_type']
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select listing type" />
                </SelectTrigger>
                <SelectContent>
                  {listingTypes
                    .filter(type => formData.category !== 'rooms' || type !== 'sell')
                    .map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.category === 'rooms' && (
                <p className="text-sm text-muted-foreground">
                  Rooms can only be rented, not sold.
                </p>
              )}
            </div>

            {/* Sale Price */}
            {formData.listing_type !== 'rent' && (
              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price (€)</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Rental Price and Period */}
            {formData.listing_type !== 'sell' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rental_price">Rental Price (€)</Label>
                  <Input
                    id="rental_price"
                    type="number"
                    step="0.01"
                    value={formData.rental_price}
                    onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rental Period</Label>
                  <Select 
                    value={formData.rental_period} 
                    onValueChange={(value) => setFormData({
                      ...formData, 
                      rental_period: value as Database['public']['Enums']['rental_period']
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentalPeriods.map((period) => (
                        <SelectItem key={period} value={period}>
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Image Summary */}
            {images.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  📷 {images.length} image{images.length !== 1 ? 's' : ''} will be uploaded with this item
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gap-2" 
                disabled={
                  !formData.title || 
                  !formData.category || 
                  !formData.condition || 
                  !formData.listing_type ||
                  isLoading
                }
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Publishing...' : 'Publish Item'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};