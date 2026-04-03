import { useState, useRef } from "react";
import { Camera, Upload, Sparkles, Image as ImageIcon, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { arScanImage } from "@/services/api";
import { toast } from "sonner";

const ARScannerPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("Initializing VR Environment...");
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!selectedImage) return;
    
    setIsScanning(true);
    setResult(null);
    setScanStep("Initializing VR mapping...");
    
    // Simulate steps
    const steps = [
      "Analyzing spatial depth...",
      "Extracting 3D geometry...",
      "Querying global AI dataset...",
      "Predicting perfect result..."
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setScanStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1500);
    
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64Content = selectedImage.split(",")[1];
      const response = await arScanImage(base64Content);
      setResult(response.description);
      toast.success("VR Scan completed perfectly!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to scan image. Please ensure the backend is running.");
    } finally {
      clearInterval(interval);
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI World Scanner
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-2">
          Upload a photo of a landmark, food, or landscape to get instant AI-powered details and history.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upload Section */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:border-primary/50">
            <CardContent className="flex flex-col items-center justify-center p-0 h-[400px]">
              {selectedImage ? (
                <div className={`relative group w-full h-full transition-all duration-1000 ${isScanning ? 'animate-vr-scan' : ''} ${result ? 'animate-hologram' : ''}`}>
                  <img src={selectedImage} alt="To scan" className="w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm z-10">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Change Photo
                    </Button>
                  </div>
                  {isScanning && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-xl overflow-hidden backdrop-blur-sm z-20">
                      <div className="relative w-full overflow-hidden h-full">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary/80 shadow-[0_0_30px_rgba(var(--primary),1)] animate-scan-line" />
                        <div className="flex flex-col items-center justify-center h-full gap-4 bg-background/30 backdrop-blur-md">
                          <div className="relative">
                            <Search className="h-16 w-16 text-primary animate-pulse" />
                            <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20"></div>
                          </div>
                          <span className="font-display text-xl font-bold text-primary animate-pulse tracking-wide">{scanStep}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {result && (
                    <div className="absolute inset-0 bg-secondary/10 pointer-events-none rounded-xl border border-secondary/30 shadow-[inset_0_0_20px_rgba(var(--secondary),0.5)] z-0 mix-blend-overlay"></div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-body font-semibold">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or JPEG (Max. 10MB)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          <Button 
            className="w-full gap-2 text-lg py-6 shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold" 
            disabled={!selectedImage || isScanning} 
            onClick={startScan}
          >
            {isScanning ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyzing Hologram...
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6" /> Extract Perfect 3D Prediction
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-display text-xl font-bold">
            <Info className="h-5 w-5 text-primary" /> Analysis Result
          </div>
          
          <Card className="min-h-[400px] border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)] relative overflow-hidden bg-background/60 backdrop-blur-xl">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <CardContent className="p-8 relative z-10 h-full">
              {result ? (
                <div className="animate-fade-in space-y-6">
                  <div className="prose prose-base sm:prose-lg font-body text-foreground leading-relaxed">
                    {result.split('\n').map((para, i) => {
                      if (para.startsWith('#')) {
                        return <h3 key={i} className="text-xl font-bold text-primary mt-4 mb-2">{para.replace(/#/g, '')}</h3>;
                      } else if (para.startsWith('-')) {
                        return <li key={i} className="ml-4 text-muted-foreground">{para.substring(1)}</li>;
                      } else if (para.trim() !== '') {
                        return <p key={i} className="text-muted-foreground">{para}</p>;
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                    <ImageIcon className="h-16 w-16 text-primary relative z-10" />
                  </div>
                  <p className="text-muted-foreground font-body text-lg max-w-[250px]">
                    Perfect prediction results and 3D details will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ARScannerPage;
