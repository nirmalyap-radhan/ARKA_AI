import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAssistant } from "@/services/api";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = ["What to do today?", "Suggest food", "Best photo spots", "Local transport tips"];

const dummyResponses: Record<string, string> = {
  "What to do today?": "Today I'd recommend visiting the local morning market for fresh produce, then head to the historic old town for a walking tour. In the afternoon, relax at a rooftop café with stunning views!",
  "Suggest food": "You must try the local street food scene! I recommend the night market for authentic flavors. Don't miss the traditional curry dishes and fresh seafood. For dessert, try the mango sticky rice!",
  "Best photo spots": "The sunrise viewpoint at the temple is breathtaking! Also check out the colorful alleyways in the old quarter and the infinity pool rooftop bars for sunset shots.",
  "Local transport tips": "The best way to get around is by tuk-tuk or scooter rental. Grab is also widely available. For day trips, consider hiring a private driver — it's surprisingly affordable!",
};

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI travel assistant 🌍 Ask me anything about your trip — food recommendations, activities, local tips, and more!" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const result = await chatWithAssistant(text, history);
      setMessages((prev) => [...prev, { role: "assistant", content: result.response }]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to AI assistant. Check if backend is running.");
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting to my brain right now. Please make sure the backend server is running!" 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[500px] flex-col rounded-lg border bg-card shadow-card">
      <div className="border-b bg-primary/5 px-4 py-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Bot className="h-5 w-5 text-primary" /> Travel Assistant
        </h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""} animate-fade-in`}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-body ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 animate-fade-in">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="rounded-full border bg-background px-3 py-1 text-xs font-body font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="bg-background"
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          />
          <Button size="icon" onClick={() => sendMessage(input)} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
