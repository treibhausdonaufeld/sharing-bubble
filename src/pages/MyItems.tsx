import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit3, 
  Eye, 
  Plus, 
  Calendar, 
  Euro,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyItems, useUpdateItemStatus } from "@/hooks/useMyItems";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const MyItems = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useMyItems();
  const updateStatusMutation = useUpdateItemStatus();

  const handleStatusChange = async (
    itemId: string, 
    newStatus: 'draft' | 'available' | 'reserved' | 'rented' | 'sold'
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ itemId, status: newStatus });
      toast({
        title: "Success",
        description: t('myItems.statusUpdated'),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'available': return 'bg-success text-success-foreground';
      case 'reserved': return 'bg-warning text-warning-foreground';
      case 'rented': return 'bg-primary text-primary-foreground';
      case 'sold': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('myItems.title')}</h1>
          <Button onClick={() => navigate("/list-item")} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('myItems.createItem')}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-subtle flex items-center justify-center">
                  <Plus className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('myItems.noItems')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('myItems.createFirst')}
              </p>
              <Button onClick={() => navigate("/list-item")} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('myItems.createItem')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const primaryImage = item.item_images?.find((img: any) => img.is_primary) || item.item_images?.[0];
              
              return (
                <Card key={item.id} className="overflow-hidden">
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
                        <div className="text-center text-muted-foreground">
                          <Plus className="mx-auto h-12 w-12 mb-2" />
                          <p className="text-sm">No image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {item.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/item/${item.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/list-item?edit=${item.id}`)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={cn(getStatusColor(item.status), "text-xs")}>
                        {t(`status.${item.status}`)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t(`category.${item.category}`)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    
                    {/* Price */}
                    <div className="text-lg font-semibold text-primary">
                      {item.listing_type === "sell" && item.sale_price && (
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {item.sale_price}
                        </div>
                      )}
                      {item.listing_type === "rent" && item.rental_price && (
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {item.rental_price}/{item.rental_period?.charAt(0)}
                        </div>
                      )}
                      {item.listing_type === "both" && (
                        <div className="text-sm">
                          {item.sale_price && <div>€{item.sale_price} sale</div>}
                          {item.rental_price && <div>€{item.rental_price}/{item.rental_period?.charAt(0)} rent</div>}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <div className="w-full space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t('myItems.status')}
                      </div>
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleStatusChange(item.id, value as 'draft' | 'available' | 'reserved' | 'rented' | 'sold')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">{t('status.draft')}</SelectItem>
                          <SelectItem value="available">{t('status.available')}</SelectItem>
                          <SelectItem value="reserved">{t('status.reserved')}</SelectItem>
                          <SelectItem value="rented">{t('status.rented')}</SelectItem>
                          <SelectItem value="sold">{t('status.sold')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyItems;