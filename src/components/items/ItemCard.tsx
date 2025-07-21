import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Clock, 
  ShoppingCart, 
  Calendar,
  Heart,
  MessageCircle,
  Euro
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: "new" | "used" | "broken";
  listingType: "sell" | "rent" | "both";
  salePrice?: number;
  rentalPrice?: number;
  rentalPeriod?: "hourly" | "daily" | "weekly";
  location: string;
  imageUrl?: string;
  ownerName: string;
  ownerAvatar?: string;
  ownerRating: number;
  createdAt: string;
  isFavorited?: boolean;
  ownerId?: string;
}

export const ItemCard = ({
  id,
  title,
  description,
  category,
  condition,
  listingType,
  salePrice,
  rentalPrice,
  rentalPeriod,
  location,
  imageUrl,
  ownerName,
  ownerAvatar,
  ownerRating,
  createdAt,
  isFavorited = false,
  ownerId,
}: ItemCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleMessageOwner = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!ownerId) return;
    
    navigate(`/messages/${ownerId}`);
  };
  const conditionColors = {
    new: "bg-success text-success-foreground",
    used: "bg-warning text-warning-foreground",
    broken: "bg-destructive text-destructive-foreground",
  };

  const typeColors = {
    sell: "bg-primary text-primary-foreground",
    rent: "bg-accent text-accent-foreground",
    both: "bg-gradient-warm text-white",
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-strong hover:scale-105 border-border animate-fade-in">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
            <div className="text-center text-muted-foreground">
              <ShoppingCart className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn(conditionColors[condition], "text-xs shadow-medium")}>
            {condition}
          </Badge>
          <Badge className={cn(typeColors[listingType], "text-xs shadow-medium")}>
            {listingType === "both" ? "Sell/Rent" : listingType}
          </Badge>
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all duration-300"
        >
          <Heart className={cn(
            "h-4 w-4 transition-colors",
            isFavorited ? "fill-destructive text-destructive" : "text-muted-foreground"
          )} />
        </Button>

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3">
          <div className="rounded-lg bg-background/90 backdrop-blur-sm px-3 py-1 shadow-medium">
            {listingType === "sell" && salePrice && (
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Euro className="h-3 w-3" />
                {salePrice}
              </div>
            )}
            {listingType === "rent" && rentalPrice && (
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Euro className="h-3 w-3" />
                {rentalPrice}/{rentalPeriod?.charAt(0)}
              </div>
            )}
            {listingType === "both" && (
              <div className="text-xs">
                {salePrice && <div>€{salePrice} sale</div>}
                {rentalPrice && <div>€{rentalPrice}/{rentalPeriod?.charAt(0)} rent</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{createdAt}</span>
          </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ownerAvatar} />
              <AvatarFallback className="text-xs">
                {ownerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{ownerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="text-sm text-muted-foreground">
              {ownerRating.toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-2"
          onClick={handleMessageOwner}
          disabled={!ownerId || ownerId === user?.id}
        >
          <MessageCircle className="h-4 w-4" />
          {t('item.messageOwner')}
        </Button>
        {listingType === "sell" || listingType === "both" ? (
          <Button variant="community" size="sm" className="flex-1 gap-2">
            <ShoppingCart className="h-4 w-4" />
            Buy
          </Button>
        ) : (
          <Button variant="warm" size="sm" className="flex-1 gap-2">
            <Calendar className="h-4 w-4" />
            Rent
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};