import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Conversation } from './useMessages';

interface ExtendedConversation extends Conversation {
  has_pending_requests?: boolean;
  pending_request_count?: number;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<ExtendedConversation[]> => {
      if (!user) return [];

      // Fetch messages and requests in parallel
      const [messagesResponse, requestsResponse] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('item_requests')
          .select(`
            *,
            items!inner (
              id,
              title
            )
          `)
          .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
      ]);

      if (messagesResponse.error) throw messagesResponse.error;
      if (requestsResponse.error) throw requestsResponse.error;

      const messages = messagesResponse.data;
      const requests = requestsResponse.data;

      // Get unique user IDs and item IDs from both messages and requests
      const userIds = new Set<string>();
      const itemIds = new Set<string>();
      
      messages?.forEach((message) => {
        userIds.add(message.sender_id);
        userIds.add(message.recipient_id);
        if (message.item_id) itemIds.add(message.item_id);
      });

      requests?.forEach((request) => {
        userIds.add(request.requester_id);
        userIds.add(request.owner_id);
        itemIds.add(request.item_id);
      });

      // Fetch profiles and items
      const [{ data: profiles }, { data: items }] = await Promise.all([
        userIds.size > 0 ? supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', Array.from(userIds)) : { data: [] },
        
        itemIds.size > 0 ? supabase
          .from('items')
          .select('id, title')
          .in('id', Array.from(itemIds)) : { data: [] }
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const itemMap = new Map((items || []).map(i => [i.id, i]));

      // Group conversations by user + item combination
      const conversationMap = new Map<string, ExtendedConversation>();
      
      // Process messages
      messages?.forEach((message) => {
        const isCurrentUserSender = message.sender_id === user.id;
        const otherUserId = isCurrentUserSender ? message.recipient_id : message.sender_id;
        const otherUserProfile = profileMap.get(otherUserId);
        const item = message.item_id ? itemMap.get(message.item_id) : null;
        
        const conversationKey = message.item_id ? `${otherUserId}-${message.item_id}` : otherUserId;
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            other_user_id: otherUserId,
            other_user_name: otherUserProfile?.display_name || 'Unknown User',
            other_user_avatar: otherUserProfile?.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            item_id: message.item_id || undefined,
            item_title: item?.title,
            has_pending_requests: false,
            pending_request_count: 0,
          });
        }

        // Update last message if this is more recent
        const conversation = conversationMap.get(conversationKey)!;
        if (new Date(message.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = message.content;
          conversation.last_message_time = message.created_at;
        }
      });

      // Process requests and create conversations if they don't exist
      requests?.forEach((request) => {
        const isCurrentUserRequester = request.requester_id === user.id;
        const otherUserId = isCurrentUserRequester ? request.owner_id : request.requester_id;
        const otherUserProfile = profileMap.get(otherUserId);
        const item = itemMap.get(request.item_id);
        
        const conversationKey = `${otherUserId}-${request.item_id}`;
        
        if (!conversationMap.has(conversationKey)) {
          const requestMessage = isCurrentUserRequester 
            ? `You sent a ${request.request_type} request` 
            : `New ${request.request_type} request received`;

          conversationMap.set(conversationKey, {
            other_user_id: otherUserId,
            other_user_name: otherUserProfile?.display_name || 'Unknown User',
            other_user_avatar: otherUserProfile?.avatar_url,
            last_message: requestMessage,
            last_message_time: request.created_at,
            unread_count: 0,
            item_id: request.item_id,
            item_title: item?.title,
            has_pending_requests: false,
            pending_request_count: 0,
          });
        }

        const conversation = conversationMap.get(conversationKey)!;
        
        // Count pending requests
        if (request.status === "pending") {
          conversation.has_pending_requests = true;
          conversation.pending_request_count = (conversation.pending_request_count || 0) + 1;
        }

        // Update conversation time if request is more recent
        if (new Date(request.created_at) > new Date(conversation.last_message_time)) {
          const requestMessage = isCurrentUserRequester 
            ? `You sent a ${request.request_type} request` 
            : `New ${request.request_type} request received`;
          conversation.last_message = requestMessage;
          conversation.last_message_time = request.created_at;
        }
      });

      // Count unread messages for each conversation
      for (const [_, conversation] of conversationMap) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', conversation.other_user_id)
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .eq('item_id', conversation.item_id || null);
        
        conversation.unread_count = count || 0;
      }

      return Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
    },
    enabled: !!user,
  });
};