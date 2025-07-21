import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ItemRequest {
  id: string;
  item_id: string;
  requester_id: string;
  owner_id: string;
  request_type: "buy" | "rent";
  offered_price?: number;
  counter_offer_price?: number;
  rental_start_date?: string;
  rental_end_date?: string;
  counter_start_date?: string;
  counter_end_date?: string;
  message?: string;
  counter_message?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  updated_at: string;
  items?: {
    title: string;
    listing_type: string;
    sale_price?: number;
    rental_price?: number;
    rental_period?: string;
  };
  requester_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  owner_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useItemRequests = (itemId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch requests for a specific item
  const requests = useQuery({
    queryKey: ["item-requests", itemId],
    queryFn: async () => {
      if (!itemId) return [];
      
      const { data, error } = await supabase
        .from("item_requests")
        .select(`
          *,
          items!inner (
            title,
            listing_type,
            sale_price,
            rental_price,
            rental_period
          ),
          requester_profile:profiles!requester_id!inner (
            display_name,
            avatar_url
          ),
          owner_profile:profiles!owner_id!inner (
            display_name,
            avatar_url
          )
        `)
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any;
    },
    enabled: !!itemId,
  });

  // Fetch user's requests (both sent and received)
  const userRequests = useQuery({
    queryKey: ["user-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return { sent: [], received: [] };
      
      const [sentResponse, receivedResponse] = await Promise.all([
        supabase
          .from("item_requests")
          .select(`
            *,
            items!inner (
              title,
              listing_type,
              sale_price,
              rental_price,
              rental_period
            ),
            owner_profile:profiles!owner_id!inner (
              display_name,
              avatar_url
            )
          `)
          .eq("requester_id", user.id)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("item_requests")
          .select(`
            *,
            items!inner (
              title,
              listing_type,
              sale_price,
              rental_price,
              rental_period
            ),
            requester_profile:profiles!requester_id!inner (
              display_name,
              avatar_url
            )
          `)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (sentResponse.error) throw sentResponse.error;
      if (receivedResponse.error) throw receivedResponse.error;
      
      return {
        sent: (sentResponse.data || []) as any,
        received: (receivedResponse.data || []) as any
      };
    },
    enabled: !!user?.id,
  });

  // Create new request
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      itemId: string;
      ownerId: string;
      requestType: "buy" | "rent";
      offeredPrice?: number;
      rentalStartDate?: string;
      rentalEndDate?: string;
      message?: string;
    }) => {
      if (!user?.id) throw new Error("Must be logged in");

      const { data: result, error } = await supabase
        .from("item_requests")
        .insert({
          item_id: data.itemId,
          requester_id: user.id,
          owner_id: data.ownerId,
          request_type: data.requestType as any,
          offered_price: data.offeredPrice,
          rental_start_date: data.rentalStartDate,
          rental_end_date: data.rentalEndDate,
          message: data.message,
          status: "pending" as any
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-requests"] });
      queryClient.invalidateQueries({ queryKey: ["user-requests"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Request sent successfully!");
    },
    onError: (error) => {
      console.error("Error creating request:", error);
      toast.error("Failed to send request");
    },
  });

  // Update request status
  const updateRequestMutation = useMutation({
    mutationFn: async (data: {
      requestId: string;
      status?: "accepted" | "declined" | "cancelled";
      counterOfferPrice?: number;
      counterStartDate?: string;
      counterEndDate?: string;
      counterMessage?: string;
    }) => {
      const updateData: any = {};
      
      if (data.status) updateData.status = data.status;
      if (data.counterOfferPrice !== undefined) updateData.counter_offer_price = data.counterOfferPrice;
      if (data.counterStartDate) updateData.counter_start_date = data.counterStartDate;
      if (data.counterEndDate) updateData.counter_end_date = data.counterEndDate;
      if (data.counterMessage) updateData.counter_message = data.counterMessage;

      const { data: result, error } = await supabase
        .from("item_requests")
        .update(updateData)
        .eq("id", data.requestId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-requests"] });
      queryClient.invalidateQueries({ queryKey: ["user-requests"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Request updated successfully!");
    },
    onError: (error) => {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    },
  });

  // Real-time subscription for requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("item-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item_requests",
        },
        (payload) => {
          // Invalidate relevant queries when requests change
          queryClient.invalidateQueries({ queryKey: ["item-requests"] });
          queryClient.invalidateQueries({ queryKey: ["user-requests"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    requests: requests.data || [],
    userRequests: userRequests.data || { sent: [], received: [] },
    isLoading: requests.isLoading || userRequests.isLoading,
    createRequest: createRequestMutation.mutate,
    updateRequest: updateRequestMutation.mutate,
    isCreating: createRequestMutation.isPending,
    isUpdating: updateRequestMutation.isPending,
  };
};