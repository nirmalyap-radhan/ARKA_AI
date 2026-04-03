import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider initializing...");
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) {
      console.log("Found saved user: ", savedUser);
      setUser(savedUser);
    } else {
      console.log("No saved user found.");
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const foundUser = users.find((u: any) => u.username === username && u.password === password);
    if (foundUser) {
      localStorage.setItem("auth_user", username);
      setUser(username);
      return true;
    }
    return false;
  };

  const register = async (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u: any) => u.username === username)) return false;
    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));
    return true;
  };

  const logout = () => {
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
