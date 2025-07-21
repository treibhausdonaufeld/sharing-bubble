import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MessageList } from "@/components/messaging/MessageList";
import { ChatInterface } from "@/components/messaging/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [selectedConversationId, setSelectedConversationId] = useState(conversationId);
  const { data: conversations = [] } = useConversations();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const selectedConversation = conversations.find(
    (conv) => conv.other_user_id === selectedConversationId
  );

  const handleConversationSelect = (userId: string) => {
    setSelectedConversationId(userId);
    // Update URL for deep linking
    navigate(`/messages/${userId}`, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedConversationId(undefined);
    navigate("/messages", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground">Communicate with other community members</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversation List */}
          <div className={`lg:col-span-1 ${selectedConversationId ? 'hidden lg:block' : 'block'}`}>
            <div className="h-full border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-background/50">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Conversations
                </h2>
              </div>
              <div className="p-4 overflow-y-auto h-full">
                <MessageList
                  selectedConversationId={selectedConversationId}
                  onConversationSelect={handleConversationSelect}
                />
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className={`lg:col-span-2 ${!selectedConversationId ? 'hidden lg:block' : 'block'}`}>
            <div className="h-full border border-border rounded-lg overflow-hidden">
              {selectedConversation ? (
                <ChatInterface
                  conversationUserId={selectedConversation.other_user_id}
                  conversationUserName={selectedConversation.other_user_name}
                  conversationUserAvatar={selectedConversation.other_user_avatar}
                  itemId={selectedConversation.item_id}
                  onBack={handleBackToList}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the left to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;