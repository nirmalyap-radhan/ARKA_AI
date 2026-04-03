import { useState } from "react";
import heroImage from "@/assets/hero-travel.jpg";
import TripForm from "@/components/TripForm";
import ItinerarySection, { DayPlan } from "@/components/ItinerarySection";
import ItineraryModifier from "@/components/ItineraryModifier";
import RecommendationsSection from "@/components/RecommendationsSection";
import BudgetSection from "@/components/BudgetSection";
import PackingListSection from "@/components/PackingListSection";
import TravelTipsSection from "@/components/TravelTipsSection";
import NearbyPlacesSection from "@/components/NearbyPlacesSection";
import TripSummary from "@/components/TripSummary";
import { Sparkles } from "lucide-react";
import { generateItinerary } from "@/services/api";
import { toast } from "sonner";

const dummyItinerary: DayPlan[] = [
  { day: 1, title: "Arrival & Explore", morning: "Arrive and check in to hotel. Rest and freshen up.", afternoon: "Explore the local neighborhood and find a café.", evening: "Welcome dinner at a rooftop restaurant with city views." },
  { day: 2, title: "Cultural Discovery", morning: "Visit the Grand Palace Temple complex.", afternoon: "Traditional cooking class with a local chef.", evening: "Night market food tour and shopping." },
  { day: 3, title: "Nature & Adventure", morning: "Sunrise hike to the mountain viewpoint.", afternoon: "Snorkeling tour at Crystal Beach Cove.", evening: "Beachside seafood dinner and bonfire." },
  { day: 4, title: "Local Life", morning: "Visit the floating market for local produce.", afternoon: "Explore the old town heritage quarter.", evening: "Sunset cruise along the river." },
  { day: 5, title: "Departure", morning: "Last-minute souvenir shopping.", afternoon: "Farewell lunch at a local favorite.", evening: "Transfer to the airport." },
];

import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [tripData, setTripData] = useState<{ destination: string; days: number; budget: number; style: string } | null>(null);

  const handleSubmit = async (data: { destination: string; days: string; budget: string; style: string; interests: string[] }) => {
    setIsLoading(true);
    try {
      const response = await generateItinerary({
        ...data,
        days: parseInt(data.days),
        budget: parseInt(data.budget)
      });
      
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      
      setItinerary(parsedData.itinerary || []);
      setTripData({
        destination: data.destination,
        days: parseInt(data.days),
        budget: parseInt(data.budget),
        style: data.style,
      });
      toast.success("Itinerary generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate itinerary. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setItinerary([...itinerary].reverse());
      setIsLoading(false);
    }, 1500);
  };

  const handleModify = (_instruction: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setItinerary((prev) => prev.map((d) => ({ ...d, title: d.title + " ✨" })));
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Beautiful travel destination" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-body font-medium text-primary-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4" /> AI-Powered Travel Planning
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Welcome, {user}! <br />
              Plan Your Dream Trip in Seconds
            </h1>

            <p className="mt-4 max-w-lg text-base text-primary-foreground/80 font-body md:text-lg">
              Tell us where you want to go, and our AI will craft the perfect personalized itinerary, budget breakdown, and packing list.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="container mx-auto -mt-8 px-4 relative z-10">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 shadow-elevated md:p-8 animate-scale-in">
          <h2 className="mb-6 font-display text-2xl font-bold">Plan Your Trip</h2>
          <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </section>

      {/* Results */}
      {itinerary.length > 0 && tripData && (
        <div className="container mx-auto space-y-12 px-4 pt-12">
          {/* Trip Summary */}
          <div className="animate-fade-in">
            <TripSummary {...tripData} />
          </div>

          {/* Itinerary */}
          <div className="space-y-4 animate-fade-in">
            <ItinerarySection itinerary={itinerary} destination={tripData.destination} onRegenerate={handleRegenerate} />
            <div className="mx-auto max-w-xl">
              <ItineraryModifier onModify={handleModify} />
            </div>
          </div>

          {/* Recommendations */}
          <div className="animate-fade-in">
            <RecommendationsSection />
          </div>

          {/* Budget + Packing side by side */}
          <div className="grid gap-6 lg:grid-cols-2 animate-fade-in">
            <BudgetSection totalBudget={tripData.budget} />
            <PackingListSection />
          </div>

          {/* Tips + Nearby */}
          <div className="animate-fade-in">
            <TravelTipsSection />
          </div>
          <div className="animate-fade-in">
            <NearbyPlacesSection />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
