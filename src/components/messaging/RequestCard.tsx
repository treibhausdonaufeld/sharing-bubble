import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ItemRequest, useItemRequests } from "@/hooks/useItemRequests";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, CalendarIcon, Check, Clock, Euro, MessageSquare, X } from "lucide-react";
import { useState } from "react";

interface RequestCardProps {
  request: ItemRequest;
  currentUserId: string;
  onMessage?: () => void;
}

export const RequestCard = ({ request, currentUserId, onMessage }: RequestCardProps) => {
  const { updateRequest, isUpdating } = useItemRequests();
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState(request.offered_price || 0);
  const [counterMessage, setCounterMessage] = useState("");
  const [counterStartDate, setCounterStartDate] = useState<Date>();
  const [counterEndDate, setCounterEndDate] = useState<Date>();

  const isOwner = request.owner_id === currentUserId;
  const otherUser = isOwner ? request.requester_id : request.owner_id;

  const statusColors = {
    pending: "bg-warning text-warning-foreground",
    accepted: "bg-success text-success-foreground",
    declined: "bg-destructive text-destructive-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };

  const typeColors = {
    buy: "bg-primary text-primary-foreground",
    rent: "bg-accent text-accent-foreground",
  };

  const handleAccept = () => {
    updateRequest({ requestId: request.id, status: "accepted" });
  };

  const handleDecline = () => {
    updateRequest({ requestId: request.id, status: "declined" });
  };

  const handleCancel = () => {
    updateRequest({ requestId: request.id, status: "cancelled" });
  };

  const handleCounterOffer = () => {
    updateRequest({
      requestId: request.id,
      counterOfferPrice: counterPrice,
      counterStartDate: counterStartDate?.toISOString(),
      counterEndDate: counterEndDate?.toISOString(),
      counterMessage: counterMessage || undefined,
    });
    setCounterOfferOpen(false);
  };

  return (
    <>
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback>
                  {otherUser?.display_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-sm">{otherUser?.display_name}</h4>
                <p className="text-xs text-muted-foreground">
                  {isOwner ? "wants to" : "you want to"} {request.request_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", typeColors[request.request_type])}>
                {request.request_type}
              </Badge>
              <Badge className={cn("text-xs", statusColors[request.status])}>
                {request.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Item Info */}
          <div className="text-sm">
            <p className="font-medium">{request.items?.title}</p>
          </div>

          {/* Price Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Offered:</span>
            <div className="flex items-center gap-1 font-medium">
              <Euro className="h-3 w-3" />
              {request.offered_price}
            </div>
          </div>

          {/* Counter Offer Info */}
          {request.counter_offer_price && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Counter offer:</span>
              <div className="flex items-center gap-1 font-medium">
                <Euro className="h-3 w-3" />
                {request.counter_offer_price}
              </div>
            </div>
          )}

          {/* Rental Dates */}
          {request.request_type === "rent" && (request.rental_start_date || request.rental_end_date) && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Requested dates:</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{request.rental_start_date && format(new Date(request.rental_start_date), "PPP")}</span>
                <span>→</span>
                <span>{request.rental_end_date && format(new Date(request.rental_end_date), "PPP")}</span>
              </div>
            </div>
          )}

          {/* Counter Offer Dates */}
          {request.request_type === "rent" && (request.counter_start_date || request.counter_end_date) && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Counter offer dates:</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{request.counter_start_date && format(new Date(request.counter_start_date), "PPP")}</span>
                <span>→</span>
                <span>{request.counter_end_date && format(new Date(request.counter_end_date), "PPP")}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {request.message && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Message:</p>
              <p className="text-foreground">{request.message}</p>
            </div>
          )}

          {request.counter_message && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Counter offer message:</p>
              <p className="text-foreground">{request.counter_message}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
          </div>

          {/* Action Buttons */}
          {request.status === "pending" && (
            <div className="flex gap-2">
              {isOwner ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAccept}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCounterOfferOpen(true)}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Counter
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDecline}
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel Request
                </Button>
              )}
            </div>
          )}

          {/* Message Button */}
          {onMessage && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMessage}
              className="w-full"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Message
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Counter Offer Dialog */}
      <Dialog open={counterOfferOpen} onOpenChange={setCounterOfferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make Counter Offer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="counter-price">Counter Price</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="counter-price"
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Dates for rentals */}
            {request.request_type === "rent" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !counterStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {counterStartDate ? format(counterStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={counterStartDate}
                        onSelect={setCounterStartDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !counterEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {counterEndDate ? format(counterEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={counterEndDate}
                        onSelect={setCounterEndDate}
                        disabled={(date) => date < (counterStartDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="counter-message">Message (Optional)</Label>
              <Textarea
                id="counter-message"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Add a message..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCounterOfferOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCounterOffer} disabled={isUpdating} className="flex-1">
                {isUpdating ? "Sending..." : "Send Counter Offer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};