import { useState } from "react";
import { Shirt, Briefcase, Smartphone, CheckSquare, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface PackingItem {
  id: string;
  name: string;
  checked: boolean;
}

interface PackingCategory {
  name: string;
  icon: React.ElementType;
  items: PackingItem[];
}

const defaultPacking: PackingCategory[] = [
  {
    name: "Clothes",
    icon: Shirt,
    items: [
      { id: "c1", name: "T-shirts (4-5)", checked: false },
      { id: "c2", name: "Light jacket", checked: false },
      { id: "c3", name: "Comfortable walking shoes", checked: false },
      { id: "c4", name: "Swimwear", checked: false },
      { id: "c5", name: "Hat / Sunglasses", checked: false },
    ],
  },
  {
    name: "Essentials",
    icon: Briefcase,
    items: [
      { id: "e1", name: "Passport & copies", checked: false },
      { id: "e2", name: "Travel insurance docs", checked: false },
      { id: "e3", name: "Sunscreen SPF 50+", checked: false },
      { id: "e4", name: "First aid kit", checked: false },
      { id: "e5", name: "Reusable water bottle", checked: false },
    ],
  },
  {
    name: "Gadgets",
    icon: Smartphone,
    items: [
      { id: "g1", name: "Phone charger & power bank", checked: false },
      { id: "g2", name: "Universal adapter", checked: false },
      { id: "g3", name: "Camera / GoPro", checked: false },
      { id: "g4", name: "Noise-canceling headphones", checked: false },
    ],
  },
];

const PackingListSection = () => {
  const [categories, setCategories] = useState<PackingCategory[]>([]);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setCategories(defaultPacking);
    setGenerated(true);
  };

  const toggleItem = (catIdx: number, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === catIdx
          ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)) }
          : cat
      )
    );
  };

  const total = categories.reduce((a, c) => a + c.items.length, 0);
  const checked = categories.reduce((a, c) => a + c.items.filter((i) => i.checked).length, 0);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <CheckSquare className="h-5 w-5 text-primary" /> Packing List
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!generated ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-muted-foreground font-body text-sm text-center">
              Generate a smart packing list based on your destination and travel style.
            </p>
            <Button onClick={generate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-body">
              <Sparkles className="h-4 w-4" /> Generate Packing List
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm font-body text-muted-foreground">
              {checked}/{total} items packed
            </p>
            {categories.map((cat, catIdx) => (
              <div key={cat.name} className="space-y-2">
                <h4 className="flex items-center gap-2 font-body font-semibold text-sm">
                  <cat.icon className="h-4 w-4 text-primary" /> {cat.name}
                </h4>
                <div className="space-y-1.5 pl-6">
                  {cat.items.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(catIdx, item.id)}
                      />
                      <span className={`text-sm font-body transition-all ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                        {item.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackingListSection;
