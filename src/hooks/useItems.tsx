import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Item = Database['public']['Tables']['items']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'];
  item_images?: Database['public']['Tables']['item_images']['Row'][];
};

export const useItems = (category?: string | Database['public']['Enums']['item_category']) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('items')
          .select(`
            *,
            profiles(
              display_name,
              avatar_url,
              rating,
              total_ratings
            ),
            item_images(
              image_url,
              is_primary,
              display_order
            )
          `)
          .eq('status', 'available')
          .order('created_at', { ascending: false });

        if (category && category !== 'all') {
          query = query.eq('category', category as Database['public']['Enums']['item_category']);
        }

        const { data, error } = await query;

        if (error) throw error;
        setItems((data as any) || []);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [category]);

  return { items, loading, error, refetch: () => window.location.reload() };
};