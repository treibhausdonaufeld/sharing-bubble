import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ListItem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    'tools', 'kitchen', 'garden', 'toys', 'vehicles', 'other'
  ];

  const conditions = ['new', 'used', 'broken'];
  const listingTypes = ['sell', 'rent', 'both'];
  const rentalPeriods = ['hourly', 'daily', 'weekly'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const itemData: Database['public']['Tables']['items']['Insert'] = {
        title: formData.title,
        description: formData.description,
        category: formData.category as Database['public']['Enums']['item_category'],
        condition: formData.condition as Database['public']['Enums']['item_condition'],
        listing_type: formData.listing_type as Database['public']['Enums']['listing_type'],
        user_id: user.id,
        status: 'available',
        ...(formData.listing_type !== 'rent' && { sale_price: parseFloat(formData.sale_price) }),
        ...(formData.listing_type !== 'sell' && {
          rental_price: parseFloat(formData.rental_price),
          rental_period: formData.rental_period as Database['public']['Enums']['rental_period']
        })
      };

      const { error } = await supabase
        .from('items')
        .insert(itemData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item listed successfully!",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error listing item:', error);
      toast({
        title: "Error",
        description: "Failed to list item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>List New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter item title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, category: value as Database['public']['Enums']['item_category'] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, condition: value as Database['public']['Enums']['item_condition'] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition.replace('_', ' ').charAt(0).toUpperCase() + condition.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Listing Type</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, listing_type: value as Database['public']['Enums']['listing_type'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select listing type" />
                  </SelectTrigger>
                  <SelectContent>
                    {listingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.listing_type !== 'rent' && (
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Sale Price ($)</Label>
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
                    <Label htmlFor="rental_price">Rental Price ($)</Label>
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
                    <Select onValueChange={(value) => setFormData({ ...formData, rental_period: value as Database['public']['Enums']['rental_period'] })}>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Listing...' : 'List Item'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ListItem;