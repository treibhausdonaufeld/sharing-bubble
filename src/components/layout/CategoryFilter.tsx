import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Wrench, 
  Sofa, 
  BookOpen, 
  Dumbbell, 
  Shirt, 
  ChefHat, 
  Flower2, 
  Gamepad2, 
  Car,
  MoreHorizontal,
  Grid3x3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const categories = [
  { id: "all", name: "All Items", icon: Grid3x3 },
  { id: "electronics", name: "Electronics", icon: Smartphone },
  { id: "tools", name: "Tools", icon: Wrench },
  { id: "furniture", name: "Furniture", icon: Sofa },
  { id: "books", name: "Books", icon: BookOpen },
  { id: "sports", name: "Sports", icon: Dumbbell },
  { id: "clothing", name: "Clothing", icon: Shirt },
  { id: "kitchen", name: "Kitchen", icon: ChefHat },
  { id: "garden", name: "Garden", icon: Flower2 },
  { id: "toys", name: "Toys", icon: Gamepad2 },
  { id: "vehicles", name: "Vehicles", icon: Car },
  { id: "rooms", name: "Rooms", icon: Sofa },
  { id: "other", name: "Other", icon: MoreHorizontal },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [showAll, setShowAll] = useState(false);
  const { t } = useLanguage();
  
  const getCategoryName = (id: string) => {
    switch (id) {
      case "all": return t('category.all');
      case "electronics": return t('category.electronics');
      case "tools": return t('category.tools');
      case "furniture": return t('category.furniture');
      case "books": return t('category.books');
      case "sports": return t('category.sports');
      case "clothing": return t('category.clothing');
      case "kitchen": return t('category.kitchen');
      case "garden": return t('category.garden');
      case "toys": return t('category.toys');
      case "vehicles": return t('category.vehicles');
      case "rooms": return t('category.rooms');
      case "other": return t('category.other');
      default: return id;
    }
  };
  
  const visibleCategories = showAll ? categories : categories.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Categories</h3>
        <Badge variant="secondary" className="animate-bounce-gentle">
          {categories.length - 1} available
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {visibleCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "community" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "gap-2 transition-all duration-300",
                isSelected 
                  ? "shadow-glow scale-105" 
                  : "hover:scale-105 hover:shadow-medium"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{getCategoryName(category.id)}</span>
            </Button>
          );
        })}
        
        {!showAll && categories.length > 8 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">More</span>
          </Button>
        )}
      </div>
    </div>
  );
};