import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, Plus, Trash2, Calendar, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Memory {
  id: string;
  image: string;
  description: string;
  date: string;
  location?: string;
}

const MemoriesPage = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("travel_memories");
    if (saved) {
      try {
        setMemories(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load memories", e);
      }
    }
  }, []);

  const saveMemories = (m: Memory[]) => {
    setMemories(m);
    localStorage.setItem("travel_memories", JSON.stringify(m));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMemory = () => {
    if (!newImage) {
      toast.error("An image is required!");
      return;
    }
    if (!newDesc.trim()) {
      toast.error("Please describe your memory.");
      return;
    }

    const memory: Memory = {
      id: Date.now().toString(),
      image: newImage,
      description: newDesc.trim(),
      date: new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      location: newLocation.trim() || undefined
    };

    saveMemories([memory, ...memories]);
    
    // Reset form
    setNewImage(null);
    setNewDesc("");
    setNewLocation("");
    setIsAdding(false);
    toast.success("Memory captured beautifully!");
  };

  const handleDelete = (id: string) => {
    saveMemories(memories.filter(m => m.id !== id));
    toast.success("Memory removed.");
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight flex items-center gap-3 text-foreground">
            Travel Memories
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-body">Preserve the moments that take your breath away.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="h-12 px-6 rounded-2xl shadow-elevated hover:-translate-y-1 transition-transform">
            <Plus className="h-5 w-5 mr-2" /> Captue New Memory
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="mb-12 border-primary/20 bg-background/50 backdrop-blur-xl shadow-glow overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" /> Frame Your Moment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              
              <div 
                className={`relative rounded-3xl border-2 border-dashed ${newImage ? 'border-primary/50 bg-black/5' : 'border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 cursor-pointer'} aspect-[4/3] flex flex-col items-center justify-center overflow-hidden transition-all group`}
                onClick={() => !newImage && fileInputRef.current?.click()}
              >
                {newImage ? (
                  <>
                    <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setNewImage(null); }} className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border-0">
                         Retake Photo
                       </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Click to upload photo</p>
                    <p className="text-xs text-muted-foreground mt-2">High quality JPEG or PNG</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="space-y-5 flex flex-col justify-center">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Where were you?</label>
                  <Input 
                    placeholder="e.g. Eiffel Tower, Paris" 
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="h-12 bg-background/50 border-input font-body text-base rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">The Story</label>
                  <textarea 
                    placeholder="Describe how this moment felt..." 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full min-h-[120px] p-4 bg-background/50 border border-input rounded-xl font-body text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground/50 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button className="h-12 flex-1 rounded-xl shadow-elevated hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all" onClick={handleSaveMemory}>
                    Save to Journal
                  </Button>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {memories.length === 0 && !isAdding ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed border-muted rounded-3xl">
           <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <Camera className="h-10 w-10 text-muted-foreground opacity-50" />
           </div>
           <h3 className="text-2xl font-display font-medium text-foreground mb-2">No memories yet</h3>
           <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Upload your first travel photo and start building your interactive travel journal.</p>
           <Button onClick={() => setIsAdding(true)} variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5">Start Journaling</Button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {memories.map((memory) => (
            <div key={memory.id} className="break-inside-avoid relative group animate-fade-in-up">
              <Card className="overflow-hidden border-border/40 hover:shadow-elevated transition-all duration-500 bg-card/80 backdrop-blur-sm shadow-sm rounded-3xl">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={memory.image} alt={memory.description} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  <button 
                    onClick={() => handleDelete(memory.id)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-destructive transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    {memory.location && (
                      <div className="flex items-center gap-1.5 text-white/90 mb-2">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">{memory.location}</span>
                      </div>
                    )}
                    <p className="text-white font-body text-sm md:text-base leading-snug font-medium line-clamp-3 group-hover:line-clamp-none transition-all">
                      "{memory.description}"
                    </p>
                    <div className="flex items-center gap-1.5 text-white/60 mt-4 text-xs font-medium">
                      <Calendar className="h-3 w-3" />
                      {memory.date}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoriesPage;
