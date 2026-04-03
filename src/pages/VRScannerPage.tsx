import { useState, useRef } from "react";
import { 
  Search, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Rotate3d, 
  History, 
  Building2, 
  Info,
  ChevronRight,
  Target,
  Satellite,
  Box,
  Mic,
  ArrowLeft,
  Crosshair,
  Eye,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { vrScanLocation } from "@/services/api";
import { toast } from "sonner";

// --- Main Page ---

const VRScannerPage = () => {
  const [location, setLocation] = useState("");
  const [monuments, setMonuments] = useState<any[]>([]);
  const [selectedMonument, setSelectedMonument] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [monumentImage, setMonumentImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [scanPhase, setScanPhase] = useState<"photo" | "vr">("photo");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const synthesisRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    setIsScanning(true);
    setMonuments([]);
    setSelectedMonument(null);
    stopSpeech();

    try {
      const response = await vrScanLocation(location);
      setMonuments(response.monuments || []);
      if (response.monuments?.length === 0) {
        toast.info("No monuments detected in this sector.");
      } else {
        toast.success(`${response.monuments.length} TARGETS ACQUIRED`);
      }
    } catch (error) {
      console.error(error);
      toast.error("SCAN ERROR: SATELLITE LINK LOST");
    } finally {
      setIsScanning(false);
    }
  };

  const startSpeech = (text: string) => {
    stopSpeech();
    if (!synthesisRef.current) return;
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = 1.05;
    utteranceRef.current.pitch = 0.9;
    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => setIsSpeaking(false);
    synthesisRef.current.speak(utteranceRef.current);
  };

  const stopSpeech = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const fetchMonumentImage = async (name: string) => {
    setIsLoadingImage(true);
    setMonumentImage(null);
    setScanPhase("photo");
    try {
      // Wikipedia REST API — free, no key required
      const slug = encodeURIComponent(name.replace(/ /g, "_"));
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`);
      if (res.ok) {
        const data = await res.json();
        const img = data?.thumbnail?.source || data?.originalimage?.source || null;
        setMonumentImage(img);
      }
    } catch (e) {
      console.warn("Could not fetch Wikipedia image", e);
    } finally {
      setIsLoadingImage(false);
      // After image loads, switch to VR overlay mode after 2s
      setTimeout(() => setScanPhase("vr"), 2000);
    }
  };

  const handleMonumentSelect = (monument: any) => {
    setSelectedMonument(monument);
    setIsVRMode(true);
    fetchMonumentImage(monument.name);
    // Delay speech slightly so image can load first
    setTimeout(() => {
      startSpeech(`Scanning target: ${monument.name}. ${monument.description}`);
    }, 2500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  const closeVR = () => {
    setIsVRMode(false);
    stopSpeech();
    setMonumentImage(null);
    setScanPhase("photo");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#00f2ff] p-4 md:p-8 font-mono relative overflow-hidden animate-grid-move">
      {/* HUD Borders */}
      <div className="fixed inset-0 pointer-events-none z-10 border-[1px] border-[#00f2ff22]">
        <div className="absolute top-0 left-0 w-20 h-20 border-l border-t border-[#00f2ff]"></div>
        <div className="absolute top-0 right-0 w-20 h-20 border-r border-t border-[#00f2ff]"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-l border-b border-[#00f2ff]"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r border-b border-[#00f2ff]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-20 space-y-8">
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-black/60 p-8 border border-[#00f2ff33] backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.05)]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#00f2ff22] flex items-center justify-center border border-[#00f2ff44]">
                <Satellite className="h-6 w-6 animate-pulse" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">VR MONUMENT SCANNER</h1>
            </div>
            <p className="text-xs opacity-50 flex items-center gap-2">
              <Target className="h-3 w-3" /> ORBITAL DATA FEED: ONLINE [SATELLITE_ID: TW-VR-9]
            </p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00f2ff] opacity-50 group-focus-within:opacity-100" />
              <input 
                type="text" 
                placeholder="INPUT COORDS / LOCATION..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-black/40 border border-[#00f2ff33] rounded-xl pl-12 pr-6 py-4 w-full md:w-80 focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff33] transition-all placeholder:text-[#00f2ff44] text-sm uppercase tracking-widest"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isScanning}
              className="bg-[#00f2ff] hover:bg-[#00f2ff]/90 text-black font-black uppercase tracking-widest px-8 py-4 h-auto rounded-xl transition-all shadow-[0_0_20px_#00f2ff44] hover:shadow-[0_0_30px_#00f2ff66] active:scale-95"
            >
              {isScanning ? <Rotate3d className="animate-spin" /> : <Search />}
              <span className="ml-2">INITIATE SCAN</span>
            </Button>
          </form>
        </div>

        {/* Results Console */}
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
              <Building2 className="h-3 w-3" /> Detected Entities
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {monuments.map((m, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleMonumentSelect(m)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex justify-between items-center group relative overflow-hidden ${
                      selectedMonument?.name === m.name 
                      ? 'bg-[#00f2ff11] border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.1)]' 
                      : 'bg-black/40 border-[#00f2ff22] hover:border-[#00f2ff55]'
                    }`}
                  >
                    <div className="space-y-1 relative z-10">
                      <div className="text-sm font-black tracking-tight uppercase group-hover:text-[#00f2ff] transition-colors">{m.name}</div>
                      <div className="text-[10px] opacity-50 uppercase flex items-center gap-1 font-bold">
                        <Building2 className="h-3 w-3" /> {m.vr_metrics?.style || "REMARKABLE SITE"}
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${selectedMonument?.name === m.name ? 'text-[#00f2ff]' : 'opacity-30'}`} />
                  </motion.button>
                ))}
              </AnimatePresence>

              {!isScanning && monuments.length === 0 && (
                <div className="text-center py-20 border border-dashed border-[#00f2ff22] rounded-2xl opacity-30 select-none">
                  <div className="space-y-4">
                    <Crosshair className="h-12 w-12 mx-auto" />
                    <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting sector coordinates</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main HUD Display */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              {isVRMode && selectedMonument ? (
                <motion.div
                  key="vr-viewer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative h-[600px] md:h-[700px] border border-[#00f2ff33] rounded-3xl overflow-hidden bg-black/80 shadow-[inset_0_0_100px_rgba(0,242,255,0.05)]"
                >
                  <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
                    <Button 
                      onClick={closeVR}
                      className="bg-black/60 border border-[#00f2ff33] text-[#00f2ff] hover:bg-[#00f2ff11] rounded-xl px-4 h-12 uppercase text-[10px] font-black"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> EXIT VR
                    </Button>
                    <div className="h-1 w-24 bg-[#00f2ff22] rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full w-1/2 bg-[#00f2ff]" 
                      />
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 z-30 flex gap-2">
                    <Button 
                      onClick={() => isSpeaking ? stopSpeech() : startSpeech(selectedMonument.description)}
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${isSpeaking ? 'bg-[#ff0055] text-white' : 'bg-black/60 border border-[#00f2ff33] text-[#00f2ff]'}`}
                    >
                      {isSpeaking ? <VolumeX /> : <Volume2 />}
                    </Button>
                    <Button className="h-12 w-12 bg-black/60 border border-[#00f2ff33] text-[#00f2ff] rounded-xl flex items-center justify-center">
                      <Maximize2 />
                    </Button>
                  </div>

                  {/* Real Photo + VR Model Visualizer */}
                  <div 
                    className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
                    style={{ perspective: "1000px" }}
                  >
                    <AnimatePresence>
                      {monumentImage && (
                        <motion.div
                          key={monumentImage}
                          initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            rotateX: mousePos.y * -20,
                            rotateY: mousePos.x * 20,
                            translateZ: scanPhase === "vr" ? 50 : 0
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 50, 
                            damping: 20,
                            opacity: { duration: 1 } 
                          }}
                          className="relative w-[300px] h-[450px] md:w-[400px] md:h-[550px] rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8),0_0_50px_rgba(0,242,255,0.1)] group"
                        >
                          {/* Live Photo Image */}
                          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-[#00f2ff33]">
                            <img
                              src={monumentImage}
                              alt={selectedMonument?.name}
                              className={`w-full h-full object-cover transition-all duration-1000 ${scanPhase === "vr" ? "brightness-50 hue-rotate-90 saturate-200" : "brightness-100"}`}
                            />
                            
                            {/* Holographic Scan Overlay */}
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-t from-[#00f2ff22] via-transparent to-[#00f2ff11] opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            
                            {/* Scan-line Effect */}
                            <motion.div
                              className="absolute left-0 right-0 h-1 bg-[#00f2ff] shadow-[0_0_15px_#00f2ff] z-10"
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />
                          </div>

                          {/* 3D Border Glow */}
                          <div className="absolute -inset-1 rounded-2xl border-2 border-[#00f2ff44] blur-[2px] pointer-events-none" />
                          
                          {/* Floating Tech Elements */}
                          <motion.div
                            className="absolute -top-10 -right-10 w-20 h-20 border border-[#00f2ff66] rounded-lg rotate-12 flex items-center justify-center bg-black/60 backdrop-blur-md"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                             <Satellite className="h-8 w-8 animate-pulse" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Loading state */}
                    {isLoadingImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 z-50">
                        <motion.div 
                          className="w-16 h-16 border-2 border-[#00f2ff] border-t-transparent rounded-full shadow-[0_0_20px_#00f2ff]"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                        <p className="text-xs font-black tracking-[0.3em] animate-text-flicker">TARGETING SECTOR...</p>
                      </div>
                    )}
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none">
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-black/80 border border-[#00f2ff33] p-6 rounded-2xl backdrop-blur-xl pointer-events-auto flex flex-col md:flex-row gap-8 items-end"
                    >
                      <div className="flex-grow space-y-4">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black italic uppercase italic tracking-tighter text-[#00f2ff]">{selectedMonument.name}</h2>
                          <div className="flex gap-4 text-[10px] font-bold opacity-60">
                             <span className="flex items-center gap-1 uppercase tracking-widest"><MapPin className="h-3 w-3" /> {location}</span>
                             <span className="flex items-center gap-1 uppercase tracking-widest"><Building2 className="h-3 w-3" /> {selectedMonument.vr_metrics?.style}</span>
                          </div>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed max-h-24 overflow-y-auto pr-2 custom-scrollbar font-body">
                          {selectedMonument.description}
                        </p>
                      </div>

                      <div className="flex md:flex-col gap-3 min-w-[200px]">
                         <div className="bg-[#00f2ff11] border border-[#00f2ff33] p-3 rounded-lg">
                            <div className="text-[8px] uppercase font-bold opacity-50 mb-1">Estimated Height</div>
                            <div className="text-sm font-black">{selectedMonument.vr_metrics?.height}</div>
                         </div>
                         <div className="bg-[#00f2ff11] border border-[#00f2ff33] p-3 rounded-lg">
                            <div className="text-[8px] uppercase font-bold opacity-50 mb-1">Primary Material</div>
                            <div className="text-sm font-black">{selectedMonument.vr_metrics?.material}</div>
                         </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Corner Targets */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-10 -translate-y-1/2 flex flex-col gap-1">
                       {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-[#00f2ff44]"></div>)}
                    </div>
                    <div className="absolute top-[20%] left-[20%] w-20 h-20 border-l border-t border-[#00f2ff44]"></div>
                    <div className="absolute bottom-[20%] right-[20%] w-20 h-20 border-r border-b border-[#00f2ff44]"></div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[600px] md:h-[700px] border border-dashed border-[#00f2ff22] rounded-3xl flex flex-col items-center justify-center text-center space-y-6 bg-black/20"
                >
                   <div className="relative">
                      <div className="absolute inset-0 bg-[#00f2ff22] blur-3xl rounded-full scale-150"></div>
                      <Box className="h-24 w-24 text-[#00f2ff] relative animate-pulse" />
                   </div>
                   <div className="space-y-2 max-w-sm px-6">
                      <h3 className="text-xl font-black italic tracking-widest animate-text-flicker">SATELLITE DOWNLINK STANDBY</h3>
                      <p className="text-xs opacity-50 leading-relaxed uppercase pr-2">
                        Initiate a sector scan to identify cultural hubs. Select a target to initialize 3D mesh rendering and neural audio guia via TTS-Core.
                      </p>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Metrics HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Data Integrity", value: "CRYPTO-G7", icon: Activity },
                 { label: "Neural Audio", value: "TTS_V.9", icon: Mic },
                 { label: "Scan Mode", value: "DEEP SPECTRAL", icon: Eye },
                 { label: "Orbital Link", value: "STABLE", icon: Satellite }
               ].map((item, i) => (
                 <div key={i} className="bg-black/60 border border-[#00f2ff11] p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-50 uppercase">
                       <item.icon className="h-3 w-3" /> {item.label}
                    </div>
                    <div className="text-sm font-black whitespace-nowrap">{item.value}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00f2ff08] rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00f2ff08] rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
};

export default VRScannerPage;
