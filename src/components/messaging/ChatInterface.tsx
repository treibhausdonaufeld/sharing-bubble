import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, ShoppingBag } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { MessageBubble } from "./MessageBubble";
import { RequestCard } from "./RequestCard";
import { useItemRequests } from "@/hooks/useItemRequests";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  conversationUserId: string;
  conversationUserName: string;
  conversationUserAvatar?: string;
  itemId?: string;
  onBack?: () => void;
}

export const ChatInterface = ({
  conversationUserId,
  conversationUserName,
  conversationUserAvatar,
  itemId,
  onBack,
}: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, markAsRead, isSending } = useMessages(conversationUserId);
  const { requests } = useItemRequests(itemId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter requests for this conversation
  const conversationRequests = requests.filter(request => 
    (request.requester_id === user?.id && request.owner_id === conversationUserId) ||
    (request.owner_id === user?.id && request.requester_id === conversationUserId)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    messages
      .filter((message) => !message.is_read && message.recipient_id === user?.id)
      .forEach((message) => markAsRead(message.id));
  }, [messages, user?.id, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage({
        content: newMessage.trim(),
        recipientId: conversationUserId,
        itemId: itemId,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage src={conversationUserAvatar} />
          <AvatarFallback>
            {conversationUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{conversationUserName}</h3>
          {conversationRequests.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <ShoppingBag className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {conversationRequests.filter(r => r.status === "pending").length} pending requests
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages and Requests */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show requests at the top */}
        {conversationRequests.length > 0 && (
          <div className="space-y-3 pb-4 border-b border-border">
            <h4 className="text-sm font-medium text-muted-foreground">Requests</h4>
            {conversationRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                currentUserId={user?.id || ""}
              />
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 && conversationRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === user?.id}
              showAvatar={
                index === 0 ||
                messages[index - 1]?.sender_id !== message.sender_id
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};