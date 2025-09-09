import { ImageManager } from '@/components/items/ImageManager';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';


const EditItem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { itemId: editItemId } = useParams<{ itemId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(!!editItemId);
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as Database['public']['Enums']['item_category'] | '',
    condition: '' as Database['public']['Enums']['item_condition'] | '',
    listing_type: '' as Database['public']['Enums']['listing_type'] | '',
    sale_price: '',
    rental_price: '',
    rental_period: '' as Database['public']['Enums']['rental_period'] | ''
  });

  const categories = [
    'electronics', 'furniture', 'clothing', 'books', 'sports', 
    'tools', 'kitchen', 'garden', 'toys', 'vehicles', 'rooms', 'other'
  ];

  const conditions = ['new', 'used', 'broken'];
  const listingTypes = ['sell', 'rent', 'both'];
  const rentalPeriods = ['hourly', 'daily', 'weekly'];

  // Load existing item data if editing
  useEffect(() => {
    const loadItemForEdit = async () => {
      if (!editItemId || !user) return;
      
      setLoadingItem(true);
      try {
        // First, verify if the user is an owner of the item
        const { data: ownerCheck, error: ownerError } = await supabase
          .from('item_owners')
          .select('item_id')
          .eq('item_id', editItemId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (ownerError) throw ownerError;

        if (!ownerCheck) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to edit this item.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        const { data: item, error } = await supabase
          .from('items')
          .select(`
            *,
            item_images (
              id,
              image_url,
              display_order,
              is_primary
            )
          `)
          .eq('id', editItemId)
          .maybeSingle();

        if (error) throw error;
        
        if (!item) {
          toast({
            title: "Error",
            description: "Item not found.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Populate form with existing data
        setFormData({
          title: item.title || '',
          description: item.description || '',
          category: item.category || '',
          condition: item.condition || '',
          listing_type: item.listing_type || '',
          sale_price: item.sale_price?.toString() || '',
          rental_price: item.rental_price?.toString() || '',
          rental_period: item.rental_period || ''
        });

        // Load existing images
        if (item.item_images && item.item_images.length > 0) {
          const sortedImages = item.item_images.sort((a: any, b: any) => a.display_order - b.display_order);
          setExistingImages(sortedImages);
        }
      } catch (error) {
        console.error('Error loading item:', error);
        toast({
          title: "Error",
          description: "Failed to load item data.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoadingItem(false);
      }
    };

    loadItemForEdit();
  }, [editItemId, user, navigate, toast]);

  const uploadImages = async (itemId: string) => {
    const uploadPromises = images.map(async (image, index) => {
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${itemId}/${Date.now()}-${index}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, image.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      // Calculate correct display order considering existing images
      const displayOrder = existingImages.length + index;
      const isPrimary = existingImages.length === 0 && index === 0;

      return supabase
        .from('item_images')
        .insert({
          item_id: itemId,
          image_url: publicUrl,
          is_primary: isPrimary,
          display_order: displayOrder
        });
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to list an item.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.category || !formData.condition || !formData.listing_type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const itemData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category as Database['public']['Enums']['item_category'],
        condition: formData.condition as Database['public']['Enums']['item_condition'],
        listing_type: formData.listing_type as Database['public']['Enums']['listing_type'],
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        rental_price: formData.rental_price ? parseFloat(formData.rental_price) : null,
        rental_period: formData.rental_period as Database['public']['Enums']['rental_period'] || null,
        status: 'available' as Database['public']['Enums']['item_status']
      };

      let result;
      
      if (editItemId) {
        // Update existing item
        result = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editItemId)
          .select()
          .single();
      } else {
        // Create new item
        result = await supabase
          .from('items')
          .insert(itemData)
          .select()
          .single();
        
        if (result.error) throw result.error;
        
        // Create ownership record for new items
        const { error: ownerError } = await supabase
          .from('item_owners')
          .insert({
            item_id: result.data.id,
            user_id: user.id,
            role: 'owner'
          });
          
        if (ownerError) throw ownerError;
      }

      if (result.error) throw result.error;

      const item = result.data;

      // Upload images only for new items or if new images were added
      if (images.length > 0) {
        await uploadImages(item.id);
      }

      toast({
        title: "Success",
        description: editItemId ? "Item updated successfully!" : "Item listed successfully!",
      });

      // Navigate to item detail view
      navigate(`/item/${item.id}`);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: editItemId ? "Failed to update item." : "Failed to list item.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingItem) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => editItemId ? navigate(`/item/${editItemId}`) : navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{editItemId ? t('itemDetail.editItem') : t('editItem.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('editItem.itemName')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter item title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('editItem.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('editItem.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('editItem.selectCategory')}</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as Database['public']['Enums']['item_category']})}>
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
                  <Label>{t('editItem.selectCondition')}</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value as Database['public']['Enums']['item_condition']})}>
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

              <div className="space-y-2">
                <Label>Listing Type</Label>
                <Select value={formData.listing_type} onValueChange={(value) => setFormData({...formData, listing_type: value as Database['public']['Enums']['listing_type']})}>
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
                    <Select value={formData.rental_period} onValueChange={(value) => setFormData({...formData, rental_period: value as Database['public']['Enums']['rental_period']})}>
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

              <div className="space-y-2">
                <ImageManager 
                  onImagesChange={setImages}
                  onExistingImagesChange={setExistingImages}
                  existingImages={existingImages}
                  isEditing={!!editItemId}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : (editItemId ? t('common.save') : t('editItem.shareItem'))}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditItem;