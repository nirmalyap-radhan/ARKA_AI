import { MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const nearbyPlaces = [
  { name: "Crystal Beach Cove", desc: "A hidden gem with turquoise waters, perfect for snorkeling and relaxation", rating: 4.8, distance: "12 km" },
  { name: "Mountain Temple Ruins", desc: "Ancient ruins nestled in the highlands with panoramic valley views", rating: 4.6, distance: "25 km" },
  { name: "Emerald Waterfall", desc: "A stunning three-tier waterfall surrounded by lush tropical jungle", rating: 4.9, distance: "18 km" },
  { name: "Old Town Heritage Walk", desc: "Charming cobblestone streets with colonial architecture and local artisan shops", rating: 4.5, distance: "5 km" },
];

const NearbyPlacesSection = () => {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Nearby Places</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {nearbyPlaces.map((place) => (
          <Card key={place.name} className="shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(place.name)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-body font-semibold text-sm hover:text-primary transition-colors hover:underline decoration-primary/50 underline-offset-4"
                      title="View on Google Maps"
                    >
                      {place.name}
                    </a>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{place.desc}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs font-body text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-accent text-accent" /> {place.rating}
                </span>
                <span>{place.distance} away</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NearbyPlacesSection;
