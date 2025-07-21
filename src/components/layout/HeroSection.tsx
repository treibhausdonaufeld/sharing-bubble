import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Recycle, Heart, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const HeroSection = () => {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden bg-gradient-subtle py-16 md:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2 text-sm animate-bounce-gentle">
            <Heart className="h-4 w-4 text-accent" />
            Building Stronger Communities Together
          </Badge>

          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Share, Rent & Buy
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Locally
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-lg text-muted-foreground md:text-xl lg:text-2xl">
            Connect with your neighbors to share items, reduce waste, and build a 
            more sustainable community. From tools to toys, find what you need nearby.
          </p>

          {/* Action Buttons */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button variant="community" size="xl" className="gap-2 group">
              Explore Items
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="xl" className="gap-2">
              Share Your Items
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">2,547</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
            
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="rounded-full bg-accent/10 p-3">
                  <Recycle className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">8,932</div>
              <div className="text-sm text-muted-foreground">Items Shared</div>
            </div>
            
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="rounded-full bg-success/10 p-3">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">€15,420</div>
              <div className="text-sm text-muted-foreground">Money Saved</div>
            </div>
            
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="rounded-full bg-warning/10 p-3">
                  <Heart className="h-6 w-6 text-warning" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">4.8/5</div>
              <div className="text-sm text-muted-foreground">Community Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};