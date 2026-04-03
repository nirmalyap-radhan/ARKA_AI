import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ItineraryModifierProps {
  onModify: (instruction: string) => void;
}

const ItineraryModifier = ({ onModify }: ItineraryModifierProps) => {
  const [instruction, setInstruction] = useState("");

  return (
    <div className="flex gap-2">
      <Input
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g., Add more food stops, skip museums..."
        className="bg-background"
        onKeyDown={(e) => {
          if (e.key === "Enter" && instruction.trim()) {
            onModify(instruction);
            setInstruction("");
          }
        }}
      />
      <Button
        onClick={() => {
          if (instruction.trim()) {
            onModify(instruction);
            setInstruction("");
          }
        }}
        className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body shrink-0"
      >
        <Wand2 className="h-4 w-4" /> Update Plan
      </Button>
    </div>
  );
};

export default ItineraryModifier;
