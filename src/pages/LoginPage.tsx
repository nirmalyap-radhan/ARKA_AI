import { useState } from "react";
import { 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  Plane,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import heroImage from "@/assets/hero-travel.jpg";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (isLogin) {
      if (await login(username, password)) {
        toast.success("Welcome back, traveler!");
        navigate("/");
      } else {
        toast.error("Invalid username or password");
      }
    } else {
      if (await register(username, password)) {
        toast.success("Registration successful! You can now login.");
        setIsLogin(true);
      } else {
        toast.error("Username already taken");
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0f172a]">
      {/* Blurred Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          filter: "blur(8px) brightness(0.4)"
        }}
      />
      
      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden text-white">
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4 overflow-hidden">
            <img src="/images/konark_chakra.png" alt="ARKA AI Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-slate-300 mt-2 text-sm">
            {isLogin 
              ? "Access your AI travel intelligence" 
              : "Start your journey with ARKA AI"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="nomad_explorer"
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-body"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-body"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            {isLogin ? (
              <>
                Sign In <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                Register Account <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-300 hover:text-white font-medium flex items-center gap-2 mx-auto group"
          >
            {isLogin ? (
              <>
                New traveler? <span className="text-primary group-hover:underline flex items-center gap-1">Create an account <ArrowRight size={14} /></span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-primary group-hover:underline flex items-center gap-1">Sign in here <ArrowRight size={14} /></span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
