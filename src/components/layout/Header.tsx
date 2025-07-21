import { useState } from "react";
import { Search, Plus, MessageCircle, User, Moon, Sun, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-soft">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">LocalGoods</h1>
              <p className="text-xs text-muted-foreground">Community Network</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className={cn(
              "relative transition-all duration-300",
              isSearchFocused && "scale-105"
            )}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items in your community..."
                className="pl-10 shadow-soft focus:shadow-medium transition-shadow"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:scale-110 transition-transform"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Messages */}
            <Button
              variant="ghost" 
              size="icon"
              className="relative hover:scale-110 transition-transform"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                3
              </span>
            </Button>

            {/* Add Item */}
            <Button 
              variant="community" 
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Share Item</span>
            </Button>

            {/* Profile */}
            <Button variant="outline" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};