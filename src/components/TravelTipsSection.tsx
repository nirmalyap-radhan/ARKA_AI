import { Shield, Heart, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tips = [
  {
    category: "Safety Tips",
    icon: Shield,
    color: "text-destructive",
    items: [
      "Keep copies of important documents separately",
      "Register with your embassy before traveling",
      "Use hotel safes for valuables",
      "Stay aware of your surroundings in crowded areas",
    ],
  },
  {
    category: "Cultural Tips",
    icon: Heart,
    color: "text-primary",
    items: [
      "Learn basic local greetings and phrases",
      "Dress modestly when visiting temples or religious sites",
      "Ask permission before photographing locals",
      "Respect local customs around food and dining",
    ],
  },
  {
    category: "Best Practices",
    icon: Lightbulb,
    color: "text-accent",
    items: [
      "Book accommodations and flights in advance",
      "Carry a portable charger and offline maps",
      "Try street food — it's often the most authentic",
      "Leave room in your itinerary for spontaneous exploration",
    ],
  },
];

const TravelTipsSection = () => {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Travel Tips</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {tips.map((tip) => (
          <Card key={tip.category} className="shadow-card transition-all duration-300 hover:shadow-elevated">
            <CardContent className="p-5 space-y-3">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <tip.icon className={`h-5 w-5 ${tip.color}`} /> {tip.category}
              </h3>
              <ul className="space-y-2">
                {tip.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-body text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TravelTipsSection;
