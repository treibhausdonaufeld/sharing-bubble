import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MessageCircle } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageListProps {
  selectedConversationId?: string;
  onConversationSelect: (userId: string) => void;
}

export const MessageList = ({ selectedConversationId, onConversationSelect }: MessageListProps) => {
  const { data: conversations = [], isLoading, error } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Error loading conversations</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground">Start chatting with someone to see conversations here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.other_user_id}
          className={cn(
            "p-4 cursor-pointer transition-all duration-200 hover:shadow-medium",
            selectedConversationId === conversation.other_user_id && "ring-2 ring-primary"
          )}
          onClick={() => onConversationSelect(conversation.other_user_id)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.other_user_avatar} />
              <AvatarFallback>
                {conversation.other_user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-foreground truncate">
                  {conversation.other_user_name}
                </h4>
                <div className="flex items-center gap-2">
              {conversation.unread_count > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                  {conversation.unread_count}
                </Badge>
              )}
              {(conversation as any).has_pending_requests && (
                <Badge variant="warning" className="h-5 w-5 p-0 text-xs">
                  {(conversation as any).pending_request_count}
                </Badge>
              )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground truncate">
                {conversation.last_message}
              </p>
              
              {conversation.item_title && (
                <p className="text-xs text-primary mt-1">
                  About: {conversation.item_title}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};