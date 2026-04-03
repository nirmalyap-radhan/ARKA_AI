import RecommendationsSection from "@/components/RecommendationsSection";
import TravelTipsSection from "@/components/TravelTipsSection";
import NearbyPlacesSection from "@/components/NearbyPlacesSection";

const PlannerPage = () => {
  return (
    <div className="container mx-auto space-y-12 px-4 py-8 pb-20 md:pb-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Trip Planner</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Explore recommendations, tips, and nearby attractions
        </p>
      </div>
      <RecommendationsSection />
      <NearbyPlacesSection />
      <TravelTipsSection />
    </div>
  );
};

export default PlannerPage;
