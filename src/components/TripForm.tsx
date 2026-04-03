import { useState } from "react";
import { Plane, MapPin, IndianRupee, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const interests = ["Adventure", "Food", "Culture", "Nature", "Shopping"];

interface TripFormData {
  destination: string;
  days: string;
  budget: string;
  style: string;
  interests: string[];
}

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
}

const TripForm = ({ onSubmit, isLoading }: TripFormProps) => {
  const [form, setForm] = useState<TripFormData>({
    destination: "",
    days: "",
    budget: "",
    style: "",
    interests: [],
  });

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-body text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" /> Destination
          </Label>
          <Input
            placeholder="e.g., Paris, Tokyo, Bali..."
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-body text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" /> Number of Days
          </Label>
          <Input
            type="number"
            min={1}
            max={30}
            placeholder="e.g., 5"
            value={form.days}
            onChange={(e) => setForm({ ...form, days: e.target.value })}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-body text-sm font-medium">
            <IndianRupee className="h-4 w-4 text-primary" /> Budget (INR)
          </Label>
          <Input
            type="number"
            min={100}
            placeholder="e.g., 50000"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-body text-sm font-medium">
            <Plane className="h-4 w-4 text-primary" /> Travel Style
          </Label>
          <Select value={form.style} onValueChange={(v) => setForm({ ...form, style: v })}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-body text-sm font-medium">Interests</Label>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Badge
              key={interest}
              variant={form.interests.includes(interest) ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 ${
                form.interests.includes(interest)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold text-base"
        disabled={isLoading || !form.destination || !form.days}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Generating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Generate Plan
          </span>
        )}
      </Button>
    </form>
  );
};

export default TripForm;
