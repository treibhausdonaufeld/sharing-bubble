import { useState } from "react";
import { Plus, UserMinus, Crown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useItemOwners, useAddItemOwner, useRemoveItemOwner } from "@/hooks/useItemOwners";
import { useAuth } from "@/hooks/useAuth";

interface ItemOwnersManagerProps {
  itemId: string;
}

export const ItemOwnersManager = ({ itemId }: ItemOwnersManagerProps) => {
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const { user } = useAuth();
  const { data: owners = [], isLoading } = useItemOwners(itemId);
  const addOwnerMutation = useAddItemOwner();
  const removeOwnerMutation = useRemoveItemOwner();

  const handleAddOwner = async () => {
    if (!newOwnerEmail.trim()) return;
    
    await addOwnerMutation.mutateAsync({
      itemId,
      userEmail: newOwnerEmail.trim(),
      role: "co-owner",
    });
    
    setNewOwnerEmail("");
  };

  const handleRemoveOwner = async (userId: string) => {
    await removeOwnerMutation.mutateAsync({
      itemId,
      userId,
    });
  };

  if (isLoading) {
    return <div>Loading owners...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Item Owners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Owners */}
        <div className="space-y-3">
          {owners.map((owner) => (
            <div key={owner.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(owner.profiles as any)?.avatar_url} />
                  <AvatarFallback>
                    {(owner.profiles as any)?.display_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{(owner.profiles as any)?.display_name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={owner.role === "owner" ? "default" : "secondary"}>
                      {owner.role === "owner" ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </>
                      ) : (
                        "Co-owner"
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Only allow removal if current user is an owner and this isn't the last owner */}
              {owner.user_id !== user?.id && owners.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOwner(owner.user_id)}
                  disabled={removeOwnerMutation.isPending}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Owner */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter user's display name"
            value={newOwnerEmail}
            onChange={(e) => setNewOwnerEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddOwner()}
          />
          <Button
            onClick={handleAddOwner}
            disabled={!newOwnerEmail.trim() || addOwnerMutation.isPending}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};