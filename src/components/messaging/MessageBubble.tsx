import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useMessages";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
}

export const MessageBubble = ({ message, isCurrentUser, showAvatar }: MessageBubbleProps) => {
  const profile = isCurrentUser ? message.sender_profile : message.recipient_profile;

  return (
    <div className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}>
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-xs">
            {profile?.display_name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col gap-1", !showAvatar && "ml-11", isCurrentUser && !showAvatar && "mr-11 ml-0")}>
        <div
          className={cn(
            "rounded-lg px-3 py-2 max-w-xs lg:max-w-md break-words",
            isCurrentUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted text-muted-foreground"
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        
        <div className={cn("text-xs text-muted-foreground", isCurrentUser && "text-right")}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          {!isCurrentUser && !message.is_read && (
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary"></span>
          )}
        </div>
      </div>
    </div>
  );
};