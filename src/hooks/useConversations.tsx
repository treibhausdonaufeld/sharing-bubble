import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Conversation } from './useMessages';

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];

      // Get all messages for the user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs and item IDs
      const userIds = [...new Set([
        ...messages.map(m => m.sender_id),
        ...messages.map(m => m.recipient_id)
      ])];
      
      const itemIds = [...new Set(messages.map(m => m.item_id).filter(Boolean))];

      // Fetch profiles and items
      const [{ data: profiles }, { data: items }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
        itemIds.length > 0 ? supabase.from('items').select('id, title').in('id', itemIds) : { data: [] }
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const itemMap = new Map((items || []).map(i => [i.id, i]));

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach((message) => {
        const isCurrentUserSender = message.sender_id === user.id;
        const otherUserId = isCurrentUserSender ? message.recipient_id : message.sender_id;
        const otherUserProfile = profileMap.get(otherUserId);
        const item = message.item_id ? itemMap.get(message.item_id) as any : null;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            other_user_id: otherUserId,
            other_user_name: otherUserProfile?.display_name || 'Unknown User',
            other_user_avatar: otherUserProfile?.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            item_id: message.item_id || undefined,
            item_title: item?.title,
          });
        }
      });

        // Count unread messages for each conversation
        for (const [otherUserId, conversation] of conversationMap) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', otherUserId)
            .eq('recipient_id', user.id)
            .eq('is_read', false);
          
          conversation.unread_count = count || 0;
        }

        return Array.from(conversationMap.values());
    },
    enabled: !!user,
  });
};