import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/layout/HeroSection";
import { CategoryFilter } from "@/components/layout/CategoryFilter";
import { ItemCard } from "@/components/items/ItemCard";
import { useItems } from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";

// Mock data for initial demonstration
const mockItems = [
  {
    id: "1",
    title: "Professional Drill Set",
    description: "Complete drill set with various bits. Perfect for home improvement projects.",
    category: "tools",
    condition: "used" as const,
    listingType: "both" as const,
    salePrice: 45,
    rentalPrice: 8,
    rentalPeriod: "daily" as const,
    location: "Downtown, 2km away",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop",
    ownerName: "Sarah M.",
    ownerRating: 4.8,
    createdAt: "2 days ago",
    isFavorited: false,
  },
  {
    id: "2", 
    title: "MacBook Pro 13-inch",
    description: "Excellent condition laptop, perfect for work or study. Includes charger and case.",
    category: "electronics",
    condition: "used" as const,
    listingType: "sell" as const,
    salePrice: 899,
    location: "City Center, 1.5km away",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop",
    ownerName: "Alex K.",
    ownerRating: 4.9,
    createdAt: "1 day ago",
    isFavorited: true,
  },
  {
    id: "3",
    title: "Mountain Bike",
    description: "Great bike for trails and city rides. Recently serviced, ready to go!",
    category: "sports",
    condition: "used" as const,
    listingType: "rent" as const,
    rentalPrice: 15,
    rentalPeriod: "daily" as const,
    location: "Park District, 3km away",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    ownerName: "Mike R.",
    ownerRating: 4.7,
    createdAt: "3 days ago",
    isFavorited: false,
  },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { items, loading, error } = useItems(selectedCategory);
  const { user } = useAuth();

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-destructive">Error loading items: {error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {!user && <HeroSection />}
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedCategory === "all" ? "All Items" : `${selectedCategory} Items`}
              </h2>
              <div className="text-sm text-muted-foreground">
                {items.length} items found
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <p>Loading items...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p>No items found in this category.</p>
                </div>
              ) : (
                items.map((item) => (
                  <ItemCard 
                    key={item.id} 
                    id={item.id}
                    title={item.title}
                    description={item.description || ''}
                    category={item.category}
                    condition={item.condition}
                    listingType={item.listing_type}
                    salePrice={item.sale_price}
                    rentalPrice={item.rental_price}
                    rentalPeriod={item.rental_period}
                    location="Location not set"
                    imageUrl={item.item_images?.[0]?.image_url || "/placeholder.svg"}
                    ownerName={item.profiles?.display_name || 'Unknown User'}
                    ownerAvatar={item.profiles?.avatar_url}
                    ownerRating={item.profiles?.rating || 0}
                    createdAt={item.created_at}
                    isFavorited={false}
                    ownerId={item.user_id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
