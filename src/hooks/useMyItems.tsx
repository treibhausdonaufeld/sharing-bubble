import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error("User not authenticated");

      // 1. Check if user is an owner
      const { data: ownerCheck, error: ownerError } = await supabase
        .from("item_owners")
        .select("item_id")
        .eq("item_id", itemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownerError) throw ownerError;
      if (!ownerCheck) throw new Error("You are not authorized to delete this item.");

      // 2. Get all images for the item to delete from storage
      const { data: images, error: imagesError } = await supabase
        .from("item_images")
        .select("image_url")
        .eq("item_id", itemId);

      if (imagesError) throw imagesError;

      // 3. Delete images from storage
      if (images && images.length > 0) {
        const filePaths = images.map(img => {
          const url = new URL(img.image_url);
          const path = url.pathname.split('/item-images/')[1];
          return path;
        });
        const { error: storageError } = await supabase.storage
          .from("item-images")
          .remove(filePaths);
        
        if (storageError) {
            console.error("Could not delete files from storage:", storageError);
        }
      }

      // 4. Delete the item from the database.
      // Assuming ON DELETE CASCADE is set for related tables.
      const { error: deleteError } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-items", user?.id] });
      toast({
        title: "Item Deleted",
        description: "The item has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};