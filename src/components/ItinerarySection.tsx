import { Sun, Cloud, Moon, RefreshCw, Pencil, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface DayPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
}

interface ItinerarySectionProps {
  itinerary: DayPlan[];
  destination?: string;
  onRegenerate: () => void;
}

const ItinerarySection = ({ itinerary, destination, onRegenerate }: ItinerarySectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Your Itinerary</h2>
        <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-2 font-body">
          <RefreshCw className="h-4 w-4" /> Regenerate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {itinerary.map((day, i) => (
          <Card
            key={day.day}
            className="shadow-card overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardHeader className="bg-primary/5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">
                  <Badge variant="secondary" className="mr-2 bg-primary text-primary-foreground">
                    Day {day.day}
                  </Badge>
                  {day.title}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-3 group">
                <Sun className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Morning</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(day.morning + (destination ? " in " + destination : ""))}`} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors opacity-0 group-hover:opacity-100" title="View on Google Maps">
                      <MapPin className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-sm font-body text-foreground leading-relaxed">{day.morning}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Afternoon</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(day.afternoon + (destination ? " in " + destination : ""))}`} target="_blank" rel="noopener noreferrer" className="text-secondary/60 hover:text-secondary transition-colors opacity-0 group-hover:opacity-100" title="View on Google Maps">
                      <MapPin className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-sm font-body text-foreground leading-relaxed">{day.afternoon}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Moon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Evening</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(day.evening + (destination ? " in " + destination : ""))}`} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors opacity-0 group-hover:opacity-100" title="View on Google Maps">
                      <MapPin className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-sm font-body text-foreground leading-relaxed">{day.evening}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ItinerarySection;
