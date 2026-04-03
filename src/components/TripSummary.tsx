import { Calendar, DollarSign, Star, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TripSummaryProps {
  destination: string;
  days: number;
  budget: number;
  style: string;
}

const TripSummary = ({ destination, days, budget, style }: TripSummaryProps) => {
  const highlights = [
    "Grand Palace Temple visit",
    "Cooking class with local chef",
    "Sunset cruise experience",
    "Night market food tour",
  ];

  return (
    <Card className="shadow-elevated border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="font-display text-xl">Trip Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Destination</p>
              <p className="font-body font-semibold text-sm">{destination}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Duration</p>
              <p className="font-body font-semibold text-sm">{days} days</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Budget</p>
              <p className="font-body font-semibold text-sm">${budget.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-body">Style</p>
              <p className="font-body font-semibold text-sm capitalize">{style}</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Highlights</p>
          <div className="flex flex-wrap gap-2">
            {highlights.map((h) => (
              <span key={h} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-body font-medium text-primary">
                {h}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripSummary;
