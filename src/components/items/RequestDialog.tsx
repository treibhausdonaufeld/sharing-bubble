import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Euro, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useItemRequests } from "@/hooks/useItemRequests";

interface RequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    user_id: string;
    listing_type: "sell" | "rent" | "both";
    sale_price?: number;
    rental_price?: number;
    rental_period?: "hourly" | "daily" | "weekly";
  };
  requestType: "buy" | "rent";
}

export const RequestDialog = ({ isOpen, onClose, item, requestType }: RequestDialogProps) => {
  const { createRequest, isCreating } = useItemRequests();
  const [offeredPrice, setOfferedPrice] = useState<number>(
    requestType === "buy" ? item.sale_price || 0 : item.rental_price || 0
  );
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleSubmit = async () => {
    try {
      await createRequest({
        itemId: item.id,
        ownerId: item.user_id,
        requestType,
        offeredPrice: offeredPrice || undefined,
        rentalStartDate: startDate?.toISOString(),
        rentalEndDate: endDate?.toISOString(),
        message: message || undefined,
      });
      
      // Reset form and close
      setOfferedPrice(requestType === "buy" ? item.sale_price || 0 : item.rental_price || 0);
      setMessage("");
      setStartDate(undefined);
      setEndDate(undefined);
      onClose();
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  const isFormValid = requestType === "rent" ? startDate && endDate : true;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {requestType === "buy" ? "Make Purchase Offer" : "Request to Rent"}
            <Badge variant={requestType === "buy" ? "default" : "secondary"}>
              {requestType}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Item Info */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-sm text-muted-foreground">
              {requestType === "buy" ? "Sale" : "Rental"} price: €
              {requestType === "buy" ? item.sale_price : item.rental_price}
              {requestType === "rent" && item.rental_period && `/${item.rental_period}`}
            </p>
          </div>

          {/* Price Offer */}
          <div className="space-y-2">
            <Label htmlFor="price">Your Offer</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(Number(e.target.value))}
                className="pl-10"
                placeholder="Enter your offer"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Date Selection for Rentals */}
          {requestType === "rent" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
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
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < (startDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="pl-10 min-h-20"
                placeholder="Add a message to the owner..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid || isCreating}
              className="flex-1"
            >
              {isCreating ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};