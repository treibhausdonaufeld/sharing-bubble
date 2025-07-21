import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useItem = (itemId?: string) => {
  return useQuery({
    queryKey: ["item", itemId],
    queryFn: async () => {
      if (!itemId) throw new Error("Item ID is required");
      
      const { data: item, error } = await supabase
        .from("items")
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            rating,
            total_ratings
          ),
          item_images (
            id,
            image_url,
            display_order,
            is_primary
          )
        `)
        .eq("id", itemId)
        .maybeSingle();

      if (error) throw error;
      
      return item;
    },
    enabled: !!itemId,
  });
};