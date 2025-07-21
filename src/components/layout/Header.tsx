import { useState } from "react";
import { Search, Plus, MessageCircle, User, Moon, Sun, MapPin, LogOut, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { language, setLanguage, t } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
              <img 
                src="/lovable-uploads/692d6398-bc20-4174-b99c-00a1707dfb06.png" 
                alt="bubble logo" 
                className="h-10 w-10 object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">bubble</h1>
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
                placeholder={t('header.search')}
                className="pl-10 shadow-soft focus:shadow-medium transition-shadow"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:scale-110 transition-transform"
                >
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-background border border-border z-50">
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={cn("cursor-pointer", language === 'en' && "bg-accent")}
                >
                  🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('de')}
                  className={cn("cursor-pointer", language === 'de' && "bg-accent")}
                >
                  🇩🇪 Deutsch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

            {user ? (
              <>
                {/* Messages */}
                <Button
                  variant="ghost" 
                  size="icon"
                  className="relative hover:scale-110 transition-transform"
                  onClick={() => navigate("/messages")}
                >
                  <MessageCircle className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Add Item */}
                <Button 
                  variant="community" 
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate("/list-item")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('header.shareItem')}</span>
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background border border-border z-50">
                    <DropdownMenuItem className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {t('header.myProfile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('header.myItems')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('header.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Sign In Button */
              <Button 
                variant="community" 
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('header.signIn')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};