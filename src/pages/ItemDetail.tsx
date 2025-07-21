import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  MessageCircle, 
  ShoppingCart, 
  Calendar,
  MapPin, 
  Star, 
  Euro,
  Clock,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useItem } from "@/hooks/useItem";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const ItemDetail = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: item, isLoading, error } = useItem(itemId);

  const handleMessageOwner = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!item?.user_id) return;
    
    navigate(`/messages/${item.user_id}`);
  };

  const handleEditItem = () => {
    navigate(`/list-item?edit=${itemId}`);
  };

  const handleDeleteItem = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    // TODO: Implement delete functionality
    toast({
      title: "Delete functionality not implemented yet",
      description: "This feature will be available soon.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('itemDetail.notFound')}
            </h1>
            <Button onClick={() => navigate("/")} variant="outline">
              {t('itemDetail.backToItems')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.user_id;
  const profile = item.profiles as any;
  const images = item.item_images || [];
  const primaryImage = images.find((img: any) => img.is_primary) || images[0];

  const conditionColors = {
    new: "bg-success text-success-foreground",
    like_new: "bg-success/80 text-success-foreground", 
    good: "bg-warning text-warning-foreground",
    fair: "bg-warning/70 text-warning-foreground",
    poor: "bg-destructive text-destructive-foreground",
  } as const;

  const typeColors = {
    sell: "bg-primary text-primary-foreground",
    rent: "bg-accent text-accent-foreground",
    both: "bg-gradient-warm text-white",
  } as const;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('itemDetail.backToItems')}
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-border">
              {primaryImage ? (
                <img
                  src={primaryImage.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
                  <div className="text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto h-16 w-16 mb-4" />
                    <p>No image available</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image: any, index: number) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                      selectedImageIndex === index 
                        ? "border-primary" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={image.image_url}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details Section */}
          <div className="space-y-6">
            {/* Title and Badges */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn(conditionColors[item.condition as keyof typeof conditionColors] || "bg-muted text-muted-foreground")}>
                  {t(`condition.${item.condition}`)}
                </Badge>
                <Badge className={cn(typeColors[item.listing_type as keyof typeof typeColors] || "bg-muted text-muted-foreground")}>
                  {item.listing_type === "both" ? "Sell/Rent" : item.listing_type}
                </Badge>
                <Badge variant="outline">
                  {t(`category.${item.category}`)}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {item.title}
              </h1>
              
              {/* Price */}
              <div className="text-2xl font-semibold text-primary mb-4">
                {item.listing_type === "sell" && item.sale_price && (
                  <div className="flex items-center gap-1">
                    <Euro className="h-5 w-5" />
                    {item.sale_price}
                  </div>
                )}
                {item.listing_type === "rent" && item.rental_price && (
                  <div className="flex items-center gap-1">
                    <Euro className="h-5 w-5" />
                    {item.rental_price}/{item.rental_period?.charAt(0)}
                  </div>
                )}
                {item.listing_type === "both" && (
                  <div className="space-y-1">
                    {item.sale_price && <div>€{item.sale_price} sale</div>}
                    {item.rental_price && <div>€{item.rental_price}/{item.rental_period?.charAt(0)} rent</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{t('itemDetail.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('itemDetail.itemDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('item.category')}</span>
                  <span className="font-medium">{t(`category.${item.category}`)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('item.condition')}</span>
                  <span className="font-medium">{t(`condition.${item.condition}`)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('itemDetail.availability')}</span>
                  <span className="font-medium text-success">{t('item.available')}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Listed</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('itemDetail.ownerInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {profile?.display_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span>{(profile?.rating || 0).toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{profile?.total_ratings || 0} reviews</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isOwner ? (
                /* Owner Actions */
                <div className="flex gap-3">
                  <Button 
                    onClick={handleEditItem}
                    className="flex-1 gap-2"
                    variant="outline"
                  >
                    <Edit3 className="h-4 w-4" />
                    {t('itemDetail.editItem')}
                  </Button>
                  <Button 
                    onClick={handleDeleteItem}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* Buyer/Renter Actions */
                <div className="space-y-3">
                  <Button 
                    onClick={handleMessageOwner}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('itemDetail.contactOwner')}
                  </Button>
                  
                  <div className="flex gap-3">
                    {(item.listing_type === "sell" || item.listing_type === "both") && (
                      <Button variant="community" className="flex-1 gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {t('itemDetail.buyNow')}
                      </Button>
                    )}
                    {(item.listing_type === "rent" || item.listing_type === "both") && (
                      <Button variant="warm" className="flex-1 gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('itemDetail.rentNow')}
                      </Button>
                    )}
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

export default ItemDetail;