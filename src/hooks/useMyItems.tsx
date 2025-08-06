import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useMyItems = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my-items", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // First get item IDs the user owns
      const { data: ownedItemIds, error: ownerError } = await supabase
        .from("item_owners")
        .select("item_id")
        .eq("user_id", user.id);

      if (ownerError) throw ownerError;
      if (!ownedItemIds || ownedItemIds.length === 0) return [];

      const itemIds = ownedItemIds.map(item => item.item_id);

      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          item_images (
            id,
            image_url,
            is_primary
          )
        `)
        .in("id", itemIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpdateItemStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId, status }: { 
      itemId: string; 
      status: 'draft' | 'available' | 'reserved' | 'rented' | 'sold'
    }) => {
      // Check if user is an owner first
      const { data: ownerCheck } = await supabase
        .from("item_owners")
        .select("id")
        .eq("item_id", itemId)
        .eq("user_id", user?.id)
        .single();

      if (!ownerCheck) throw new Error("Not authorized to update this item");

      const { error } = await supabase
        .from("items")
        .update({ status })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items", user?.id] });
    },
  });
};