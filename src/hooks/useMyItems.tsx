import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useMyItems = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["my-items", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
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
        .eq("user_id", user.id)
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
      const { error } = await supabase
        .from("items")
        .update({ status })
        .eq("id", itemId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items", user?.id] });
    },
  });
};