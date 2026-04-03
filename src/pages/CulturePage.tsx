import { useState } from "react";
import { Search, MapPin, Calendar, BookOpen, Sparkles, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFestivals } from "@/services/api";
import { toast } from "sonner";

interface Festival {
  name: string;
  date: string;
  description: string;
  history: string;
  image_keyword: string;
}

const CulturePage = () => {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [festivals, setFestivals] = useState<Festival[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location.trim()) return;

    setIsLoading(true);
    setFestivals([]);
    
    try {
      const response = await getFestivals(location);
      setFestivals(response.festivals || []);
      if (response.festivals?.length === 0) {
        toast.info("No major festivals found for this location.");
      } else {
        toast.success(`Found cultural events in ${location}!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch cultural data. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent italic">
          Festivals & Culture
        </h1>
        <p className="text-muted-foreground font-body mt-2 max-w-xl mx-auto">
          Discover the soul of your destination. Explore vibrant traditions, ancient history, and upcoming celebrations.
        </p>
      </div>

      <div className="mx-auto max-w-2xl mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter destination (e.g. Kyoto, Rio, Venice...)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 bg-card shadow-sm border-primary/20 focus:border-primary"
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading} className="h-12 px-8 bg-primary hover:bg-primary/90">
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              "Explore"
            )}
          </Button>
        </form>
      </div>

      {festivals.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {festivals.map((fest, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-elevated group hover:-translate-y-2 transition-transform duration-300">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={`https://loremflickr.com/600/400/festival,${fest.image_keyword.replace(/ /g, ',')},${location.replace(/ /g, ',')}`} 
                  alt={fest.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <Badge className="absolute top-3 right-3 bg-secondary/90 backdrop-blur-sm border-none">
                  <Calendar className="h-3 w-3 mr-1" /> {fest.date}
                </Badge>
                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="font-display text-xl font-bold leading-tight">{fest.name}</h3>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-body text-muted-foreground leading-relaxed">
                    {fest.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-muted">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                    <BookOpen className="h-3 w-3" /> History & Origin
                  </h4>
                  <p className="text-xs font-body text-muted-foreground italic line-clamp-4 hover:line-clamp-none transition-all cursor-help">
                    {fest.history}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-body text-muted-foreground max-w-xs">
              Search for a city to uncover its cultural heartbeat and festive traditions.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default CulturePage;
