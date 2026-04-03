import { useState } from "react";
import { 
  ShieldAlert, 
  CloudLightning, 
  Map as MapIcon, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Info, 
  CheckCircle2,
  TrendingDown,
  Thermometer,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { getRiskPrediction } from "@/services/api";
import { toast } from "sonner";

interface RiskData {
  weather_risk: {
    hazard: string;
    level: "Low" | "Medium" | "High";
    advice: string;
  };
  crime_data: Array<{
    area: string;
    risk_type: string;
    safety_score: number;
  }>;
  health_alerts: Array<{
    infection: string;
    precaution: string;
  }>;
  fraud_alerts: Array<{
    scam: string;
    how_it_works: string;
    prevention: string;
  }>;
}

const RiskPredictionPage = () => {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RiskData | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location.trim()) return;

    setIsLoading(true);
    setData(null);
    
    try {
      const response = await getRiskPrediction(location);
      setData(response);
      toast.success(`Risk assessment complete for ${location}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load risk prediction data.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "High": return "text-destructive border-destructive bg-destructive/10";
      case "Medium": return "text-amber-500 border-amber-500 bg-amber-500/10";
      default: return "text-secondary border-secondary bg-secondary/10";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 max-w-7xl">
      <div className="mb-10 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="bg-primary/10 p-3 rounded-2xl w-fit">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Real-Time Risk Prediction</h1>
            <p className="text-muted-foreground font-body text-lg">
              Next-gen safety intelligence for global travelers.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter City or Country..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-14 bg-card border-primary/20 focus:border-primary text-lg"
            />
          </div>
          <Button type="submit" size="lg" disabled={isLoading} className="h-14 px-10 shadow-elevated transition-all hover:scale-105">
            {isLoading ? "Analyzing..." : "Analyze Risks"}
          </Button>
        </form>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-muted" />)}
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Weather Risk */}
            <Card className="border-none shadow-card bg-gradient-to-br from-card to-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CloudLightning className="h-6 w-6 text-primary" />
                  <Badge variant="outline" className={getLevelColor(data.weather_risk.level)}>
                    {data.weather_risk.level} Risk
                  </Badge>
                </div>
                <CardTitle className="font-display pt-2">Weather Hazards</CardTitle>
                <CardDescription className="font-semibold text-primary">{data.weather_risk.hazard}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{data.weather_risk.advice}</p>
              </CardContent>
            </Card>

            {/* Health Alerts */}
            <Card className="border-none shadow-card md:col-span-2 overflow-hidden bg-muted/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-secondary" />
                  <CardTitle className="font-display">Health & Outbreaks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {data.health_alerts.map((alert, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-background rounded-xl border border-secondary/10 shadow-sm">
                    <Stethoscope className="h-5 w-5 text-secondary shrink-0" />
                    <div>
                      <p className="font-bold text-sm">{alert.infection}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.precaution}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Crime Heatmap (Simulated) */}
            <Card className="border-none shadow-card overflow-hidden">
               <CardHeader className="bg-primary/5 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon className="h-6 w-6 text-primary" />
                    <CardTitle className="font-display">Crime Analysis Heatmap</CardTitle>
                  </div>
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {data.crime_data.map((crime, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-bold text-sm tracking-tight">{crime.area}</p>
                        <p className="text-xs text-muted-foreground ">{crime.risk_type}</p>
                      </div>
                      <span className={`text-xs font-bold ${crime.safety_score > 70 ? 'text-secondary' : 'text-primary'}`}>
                        Safety: {crime.safety_score}%
                      </span>
                    </div>
                    <Progress value={crime.safety_score} className="h-2 bg-muted transition-all" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Fraud Alerts */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 font-display text-xl font-bold pl-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Real-Time Fraud Alerts
               </div>
               <div className="grid gap-4">
                  {data.fraud_alerts.map((fraud, i) => (
                    <Card key={i} className="group border-none shadow-sm hover:shadow-md transition-all bg-card/40">
                      <CardContent className="p-4 flex gap-4">
                         <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-destructive group-hover:text-white transition-colors">
                           <ShieldAlert className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="font-bold text-sm">{fraud.scam}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 group-hover:line-clamp-none">
                              {fraud.how_it_works}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-secondary">
                               <CheckCircle2 className="h-3 w-3" /> {fraud.prevention}
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {!data && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-fade-in">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center animate-pulse">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-2xl font-bold tracking-tight text-muted-foreground">Scan for Global Risks</p>
            <p className="text-muted-foreground font-body max-w-sm">
                Unlock instant intelligence on weather hazards, crime rates, and health emergencies at your finger tips.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskPredictionPage;
