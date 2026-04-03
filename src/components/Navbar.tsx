import { Link, useLocation } from "react-router-dom";
import { Home, Map, MessageCircle, User, Plane, Scan, Music, Activity, Navigation, Image as ImagePlus, LogOut, Satellite } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Planner", path: "/planner", icon: Map },
  { label: "Chat", path: "/chat", icon: MessageCircle },
  { label: "Scanner", path: "/scanner", icon: Scan },
  { label: "VR Scanner", path: "/vr-scanner", icon: Satellite },
  { label: "Culture", path: "/culture", icon: Music },
  { label: "Risk", path: "/risk-prediction", icon: Activity },
  { label: "Tracking", path: "/tracking", icon: Navigation },
  { label: "Memories", path: "/memories", icon: ImagePlus },
  { label: "Profile", path: "/profile", icon: User },
];

const Navbar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
            <img src="/images/konark_chakra.png" alt="ARKA AI Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-xl font-bold">ARKA AI</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-body font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-body font-medium transition-colors text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card/95 backdrop-blur-lg lg:hidden">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-body transition-colors ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-body transition-colors text-red-500"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};


export default Navbar;
