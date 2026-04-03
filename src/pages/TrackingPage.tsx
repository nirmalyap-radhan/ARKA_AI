import { useState, useEffect, useCallback } from "react";
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Plane, 
  Car, 
  Hotel, 
  Search, 
  ArrowRight, 
  AlertCircle, 
  History,
  TrendingUp,
  Activity,
  Zap,
  LocateFixed,
  Route,
  Sparkles
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getRouteTracking, suggestDestination } from "@/services/api";
import { toast } from "sonner";

// Premium Leaflet Marker Icons
const createPulseIcon = (color: string) => L.divIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute h-10 w-10 animate-ping rounded-full bg-${color}/40"></div>
          <div class="relative h-4 w-4 rounded-full bg-${color} shadow-[0_0_10px_${color}] border-2 border-white"></div>
        </div>`,
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const OriginIcon = createPulseIcon('primary');
const DestinationIcon = createPulseIcon('destructive');
const LiveIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute h-12 w-12 animate-ping rounded-full bg-secondary/30"></div>
          <div class="relative h-6 w-6 rounded-full bg-secondary border-2 border-white shadow-xl flex items-center justify-center">
             <div class="h-2 w-2 rounded-full bg-white animate-pulse"></div>
          </div>
        </div>`,
  className: 'live-icon',
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

const HotelIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2983/2983973.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface TrackingResult {
  origin: { name: string, lat: number, lng: number };
  destination: { name: string, lat: number, lng: number };
  distance: string;
  duration: string;
  traffic: string;
  hotels: Array<{ name: string, lat: number, lng: number, price: string, rating: number }>;
  center: { lat: number, lng: number, zoom: number };
}

const TrackingPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TrackingResult | null>(null);
  const [livePos, setLivePos] = useState<[number, number] | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [suggestedTrips, setSuggestedTrips] = useState<{origin_city: string, destinations: {name: string, reason: string, lat: number, lng: number}[]} | null>(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    setSuggestedTrips(null);
    setData(null);
    toast.info("Accessing satellite coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Immediately show user on the map!
          setLivePos([latitude, longitude]);
          setFrom("");
          setTo("");
          
          toast.success("Location locked. Fetching intelligence...");
          const res = await suggestDestination(latitude, longitude);
          setSuggestedTrips(res);
          toast.success("Destinations suggested!");
        } catch (error) {
          console.error(error);
          toast.error("Ensure backend is restarted to reach the AI endpoint!");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Location access denied or unavailable.");
        setIsDetecting(false);
      }
    );
  };

  const startTracking = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!from.trim() || !to.trim()) return;

    setIsLoading(true);
    setLivePos(null);
    setProgress(0);
    
    try {
      const response = await getRouteTracking(from, to);
      setData(response);
      toast.success("Intelligence data received! Launching Live Feed...");
      
      // Simulate Live Pathing
      simulateLivePath(response.origin, response.destination);
    } catch (error) {
      console.error(error);
      toast.error("Cloud connectivity issue. Redirecting to backup...");
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLivePath = (start: any, end: any) => {
    let currentStep = 0;
    const totalSteps = 100;
    const interval = setInterval(() => {
      currentStep++;
      const lat = start.lat + (end.lat - start.lat) * (currentStep / totalSteps);
      const lng = start.lng + (end.lng - start.lng) * (currentStep / totalSteps);
      setLivePos([lat, lng]);
      setProgress(currentStep);
      
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        toast.info("Target has arrived at destination.");
      }
    }, 150);
  };

  const getTrafficColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "heavy": return "text-destructive border-destructive bg-destructive/5";
      case "moderate": return "text-amber-500 border-amber-500 bg-amber-500/5";
      default: return "text-secondary border-secondary bg-secondary/5";
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col md:flex-row overflow-hidden bg-background">
      {/* Premium Glass Control Sidebar */}
      <div className="w-full md:w-[420px] bg-card/60 backdrop-blur-2xl border-r border-white/10 h-full flex flex-col shadow-2xl z-30 overflow-hidden">
        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)]">
                <Navigation className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Live Tracker</h1>
            </div>
            <p className="text-muted-foreground font-body text-xs font-medium uppercase tracking-[0.2em]">
               Satellite Intel & Logistics
            </p>
          </div>

          <form onSubmit={startTracking} className="space-y-4">
            <div className="group space-y-3 p-4 rounded-2xl bg-muted/40 border border-white/5 transition-all hover:bg-muted/60">
              <div className="relative">
                <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-primary" />
                <Input
                  placeholder="Starting point..."
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="pl-8 h-10 bg-transparent border-none text-sm placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
              <div className="h-px w-full bg-border/20 ml-2 mr-2" />
              <div className="relative">
                <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-destructive" />
                <Input
                  placeholder="Target destination..."
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="pl-8 h-10 bg-transparent border-none text-sm placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
              
              {suggestedTrips && !data && (
                <div className="pt-3 pb-1 border-t border-white/5 mt-2 space-y-1.5 animate-fade-in">
                   <p className="text-[9px] font-bold uppercase text-primary ml-2 mb-1 tracking-widest">★ Highly Rated Nearby Places</p>
                   {suggestedTrips.destinations.map((dest, idx) => (
                      <div key={idx} onClick={() => { setFrom(suggestedTrips.origin_city); setTo(dest.name); }} className="group px-3 py-2.5 rounded-xl bg-white/5 hover:bg-primary/20 border border-transparent hover:border-primary/30 cursor-pointer transition-all flex items-center justify-between">
                         <div className="flex flex-col overflow-hidden mr-2">
                           <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{dest.name}</span>
                           <span className="text-[9px] text-muted-foreground truncate">{dest.reason}</span>
                         </div>
                         <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                   ))}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold shadow-elevated transition-all hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] active:scale-[0.98]" 
              disabled={isLoading || isDetecting}
            >
              {isLoading ? "Fetching Satellite Data..." : "Engage Tracking Engine"}
            </Button>
          </form>

          <Button 
            type="button" 
            variant="outline" 
            onClick={detectLocation} 
            disabled={isDetecting || isLoading}
            className="w-full border-primary/20 hover:border-primary/50 text-xs font-bold tracking-widest uppercase mt-4 bg-primary/5"
          >
            {isDetecting ? (
              <Zap className="h-4 w-4 mr-2 animate-ping" /> 
            ) : (
              <LocateFixed className="h-4 w-4 mr-2 text-primary" />
            )}
            {isDetecting ? "Triangulating Coordinates..." : "Detect My Position & Suggest Trip"}
          </Button>

          {suggestedTrips && !data && (
            <div className="pt-2 text-center animate-fade-in-up">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Select a suggested place to calculate route</p>
            </div>
          )}

          {data && (
            <div className="space-y-8 animate-fade-in-up py-4">
              <div className="flex items-center justify-between border-b border-border/10 pb-4">
                 <Badge className="bg-secondary/20 text-secondary border-none px-3 py-1 animate-pulse">
                    <Zap className="h-3 w-3 mr-1" /> LIVE FEED ACTIVE
                 </Badge>
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">ID: TRK-990-X</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                    <Activity className="h-6 w-6 text-primary mb-2" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Distance</span>
                    <span className="font-display text-xl font-black">{data.distance}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
                    <Clock className="h-6 w-6 text-secondary mb-2" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">ETA</span>
                    <span className="font-display text-xl font-black">{data.duration}</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-muted/40 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                         <span className="text-xs font-bold uppercase tracking-widest">Traffic Status</span>
                    </div>
                    <Badge variant="outline" className={`font-black uppercase text-[10px] ${getTrafficColor(data.traffic)}`}>
                       {data.traffic}
                    </Badge>
                </div>
                <Progress value={progress} className="h-2 bg-white/5 overflow-hidden" />
                <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-muted-foreground">{from}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{progress}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{to}</span>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 font-display font-black text-sm uppercase tracking-tighter">
                    <Hotel className="h-4 w-4 text-primary" /> Premier Stays Catalog
                 </div>
                 {data.hotels.map((hotel, i) => (
                   <a 
                     key={i} 
                     href={`https://www.bing.com/aclk?ld=e8hNE2mtnAP6xOYddCLBtEcDVUCUxwUc8yauPROV1ymq5R4B_7IsLXOBtbtAYprypTOX8n3psOfsuWajI25KJoZFoScllOLkiWzoRVmzLYIYjW1XkCP_IQffoMDSGgA9hGjYtfqY8s0VkXM2l8E_ciHv0bDaT-dXBdpWELstF5p_N6B5rcmLChhtNKKTZLKs8x4aVpgN5MNNghJatkQubKcZjQ_F8&u=aHR0cCUzYSUyZiUyZnd3dy5ib29raW5nLmNvbSUyZmNpdHklMmZwZiUyZmZhcmUuZW4uaHRtbCUzZmFpZCUzZDMzOTQ2MiUyNnBhZ2VuYW1lJTNkZmFyZSUyNmxhYmVsJTNkbXNuLVFJayo3TFBGanBCUUc5eWpUSkVkb2ctODAwNTgzODE0NTg1NzIlM2F0aWt3ZC04MDA1ODU4Nzc3NTcxMyUzYWxvYy05MCUzYW5lbyUzYW10ZSUzYWxwMjY1MjUzJTNhZGVjJTNhY2lkNTIwODM0MDA5JTNhYWdpZDEyODA5MzIzNjg4Njg4NjclMjZ1dG1fY2FtcGFpZ24lM2RGcmVuY2glMjUyMFBvbHluZXNpYSUyNnV0bV9tZWRpdW0lM2RjcGMlMjZ1dG1fc291cmNlJTNkYmluZyUyNnV0bV90ZXJtJTNkUUlrKjdMUEZqcEJRRzl5alRKRWRvZyUyNm1zY2xraWQlM2RlZmYzYmM2NGIxNzQxM2M1NzE3MmQ1YWViODMwYTE5NSUyNnV0bV9jb250ZW50JTNkRmFyZSUyNTIwLSUyNTIwVUZJJTI1M0EtMTMxMDEyMQ&rlid=eff3bc64b17413c57172d5aeb830a195`}
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="block group p-4 rounded-2xl bg-card border border-white/5 shadow-sm hover:border-[#003580]/40 hover:bg-muted/40 transition-all cursor-pointer"
                   >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                          <p className="font-black text-xs uppercase">{hotel.name}</p>
                          <span className="text-[9px] text-[#003580] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5">↳ Booking.com</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary text-[10px] border-none shrink-0">★ {hotel.rating}</Badge>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">{hotel.price} / NIGHT</span>
                         <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-[#003580] transition-colors" />
                      </div>
                   </a>
                 ))}
              </div>
            </div>
          )}

          {!data && !isLoading && !suggestedTrips && (
            <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4">
               <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                  <LocateFixed className="h-10 w-10 text-muted opacity-40 animate-spin-slow" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Awaiting Search Command</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Intelligent Map */}
      <div className="flex-1 relative">
        <MapContainer 
          center={data ? [data.center.lat, data.center.lng] : (livePos ? livePos : [20, 0])} 
          zoom={data ? data.center.zoom : (livePos ? 12 : 2)} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!data && livePos && <ChangeView center={livePos} zoom={12} />}
          {!data && livePos && (
             <Marker position={livePos} icon={LiveIcon}>
                <Popup className="font-display text-center font-bold">YOUR LOCATION<br /><span className="text-[10px] font-normal">Active Signal</span></Popup>
             </Marker>
          )}
          {!data && suggestedTrips && suggestedTrips.destinations.map((dest, i) => (
             dest.lat && dest.lng ? (
               <Marker key={`s-${i}`} position={[dest.lat, dest.lng]} icon={DestinationIcon}>
                 <Popup className="font-display text-center">
                    <span className="font-black text-xs uppercase text-primary">{dest.name}</span><br />
                    <span className="text-[10px] text-muted-foreground">{dest.reason}</span><br />
                 </Popup>
               </Marker>
             ) : null
          ))}
          {data && (
            <>
              <ChangeView center={[data.center.lat, data.center.lng]} zoom={data.center.zoom} />
              <Marker position={[data.origin.lat, data.origin.lng]} icon={OriginIcon}>
                <Popup className="font-display">Start Point: {data.origin.name}</Popup>
              </Marker>
              <Marker position={[data.destination.lat, data.destination.lng]} icon={DestinationIcon}>
                <Popup className="font-display">Strategic End: {data.destination.name}</Popup>
              </Marker>
              {livePos && (
                <Marker position={livePos} icon={LiveIcon}>
                   <Popup className="font-display text-center font-bold">LIVE TRACKING<br /><span className="text-[10px] font-normal">Active Signal</span></Popup>
                </Marker>
              )}
              {data.hotels.map((h, i) => (
                <Marker key={i} position={[h.lat, h.lng]} icon={HotelIcon}>
                  <Popup className="font-display">
                    <a 
                      href={`https://www.bing.com/aclk?ld=e8hNE2mtnAP6xOYddCLBtEcDVUCUxwUc8yauPROV1ymq5R4B_7IsLXOBtbtAYprypTOX8n3psOfsuWajI25KJoZFoScllOLkiWzoRVmzLYIYjW1XkCP_IQffoMDSGgA9hGjYtfqY8s0VkXM2l8E_ciHv0bDaT-dXBdpWELstF5p_N6B5rcmLChhtNKKTZLKs8x4aVpgN5MNNghJatkQubKcZjQ_F8&u=aHR0cCUzYSUyZiUyZnd3dy5ib29raW5nLmNvbSUyZmNpdHklMmZwZiUyZmZhcmUuZW4uaHRtbCUzZmFpZCUzZDMzOTQ2MiUyNnBhZ2VuYW1lJTNkZmFyZSUyNmxhYmVsJTNkbXNuLVFJayo3TFBGanBCUUc5eWpUSkVkb2ctODAwNTgzODE0NTg1NzIlM2F0aWt3ZC04MDA1ODU4Nzc3NTcxMyUzYWxvYy05MCUzYW5lbyUzYW10ZSUzYWxwMjY1MjUzJTNhZGVjJTNhY2lkNTIwODM0MDA5JTNhYWdpZDEyODA5MzIzNjg4Njg4NjclMjZ1dG1fY2FtcGFpZ24lM2RGcmVuY2glMjUyMFBvbHluZXNpYSUyNnV0bV9tZWRpdW0lM2RjcGMlMjZ1dG1fc291cmNlJTNkYmluZyUyNnV0bV90ZXJtJTNkUUlrKjdMUEZqcEJRRzl5alRKRWRvZyUyNm1zY2xraWQlM2RlZmYzYmM2NGIxNzQxM2M1NzE3MmQ1YWViODMwYTE5NSUyNnV0bV9jb250ZW50JTNkRmFyZSUyNTIwLSUyNTIwVUZJJTI1M0EtMTMxMDEyMQ&rlid=eff3bc64b17413c57172d5aeb830a195`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-black text-xs hover:text-[#003580] transition-colors hover:underline"
                    >
                      {h.name} <span className="text-[9px] text-muted-foreground ml-1">➚</span>
                    </a><br />
                    Score: {h.rating} ★
                  </Popup>
                </Marker>
              ))}
              <Polyline 
                positions={[[data.origin.lat, data.origin.lng], [data.destination.lat, data.destination.lng]]} 
                pathOptions={{
                  color: "var(--primary)",
                  weight: 3,
                  opacity: 0.8,
                  dashArray: "10, 15",
                  lineCap: "round"
                }} 
              />
            </>
          )}
        </MapContainer>
        
        {/* Floating Premium Map Overlay */}
        <div className="absolute top-6 left-6 z-[1000] hidden md:block">
            <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-white/5 shadow-2xl flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Origin</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Target</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Live Unit</span>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .animate-scan-line { animation: scan 3s infinite linear; }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-spin-slow { animation: spin 8s infinite linear; }
      `}</style>
    </div>
  );
};

export default TrackingPage;
