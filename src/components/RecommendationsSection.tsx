import { MapPin, Utensils, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const recommendations = [
  {
    category: "Top Places",
    icon: MapPin,
    items: [
      { name: "Grand Palace Temple", desc: "A stunning architectural marvel with intricate golden details", image: "🏛️" },
      { name: "Floating Market", desc: "Experience local life and fresh produce on the waterways", image: "🛶" },
      { name: "Sunset Viewpoint", desc: "Panoramic views of the city at golden hour", image: "🌅" },
    ],
  },
  {
    category: "Activities",
    icon: Ticket,
    items: [
      { name: "Cooking Class", desc: "Learn to make authentic local dishes with a master chef", image: "👨‍🍳" },
      { name: "Snorkeling Tour", desc: "Explore crystal-clear waters and vibrant coral reefs", image: "🤿" },
      { name: "Night Market Walk", desc: "Discover hidden gems and street performances", image: "🎪" },
    ],
  },
  {
    category: "Food Suggestions",
    icon: Utensils,
    items: [
      { name: "Pad Thai Street Stall", desc: "The most authentic pad thai you'll ever taste", image: "🍜" },
      { name: "Rooftop Dining", desc: "Fine dining with breathtaking skyline views", image: "🍷" },
      { name: "Local Bakery", desc: "Fresh pastries and artisan coffee every morning", image: "🥐" },
    ],
  },
];

const RecommendationsSection = () => {
  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl font-bold">Personalized Recommendations</h2>
      {recommendations.map((cat) => (
        <div key={cat.category} className="space-y-3">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <cat.icon className="h-5 w-5 text-primary" /> {cat.category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((item) => (
              <Card key={item.name} className="shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 cursor-pointer">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="text-3xl">{item.image}</span>
                  <div>
                    <p className="font-body font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendationsSection;
