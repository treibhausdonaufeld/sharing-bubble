import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ItemOwner {
  id: string;
  item_id: string;
  user_id: string;
  role: 'owner' | 'co-owner';
  created_at: string;
  added_by?: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useItemOwners = (itemId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["item-owners", itemId],
    queryFn: async () => {
      if (!itemId) throw new Error("Item ID is required");
      
      const { data, error } = await supabase
        .from("item_owners")
        .select(`
          *,
          profiles!item_owners_user_id_fkey(
            display_name,
            avatar_url
          )
        `)
        .eq("item_id", itemId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!itemId && !!user,
  });
};

export const useAddItemOwner = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      userEmail, 
      role = 'co-owner' 
    }: { 
      itemId: string; 
      userEmail: string; 
      role?: 'owner' | 'co-owner';
    }) => {
      if (!user) throw new Error("User not authenticated");

      // First, find the user by email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", userEmail) // We'll use display_name for now, could be improved
        .single();

      if (profileError) throw new Error("User not found with that email");

      // Add the owner
      const { error } = await supabase
        .from("item_owners")
        .insert({
          item_id: itemId,
          user_id: profileData.user_id,
          role,
          added_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["item-owners", itemId] });
      toast({
        title: "Owner added",
        description: "The user has been added as an owner of this item.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveItemOwner = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      userId 
    }: { 
      itemId: string; 
      userId: string;
    }) => {
      const { error } = await supabase
        .from("item_owners")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["item-owners", itemId] });
      toast({
        title: "Owner removed",
        description: "The user has been removed as an owner of this item.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};