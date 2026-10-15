import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_BASE } from "@/config";

type AppRole = "farmer" | "consumer";

interface AuthContextType {
  user: any;
  role: AppRole | null;
  token: string | null;
  loading: boolean;
  login: (userData: any, userToken: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  token: null,
  loading: true,
  login: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentProfile = async (storedToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${storedToken}`
        }
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
        setRole((profile.role as AppRole) || "farmer");
        localStorage.setItem("agri_user", JSON.stringify(profile));
      } else {
        if (res.status === 401) {
          // Token is invalid/expired - clear stale auth keys cleanly
          localStorage.removeItem("agri_token");
          localStorage.removeItem("agri_user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          setUser(null);
          setRole(null);
          setToken(null);
        } else {
          // Fallback to stored user if server me check returns error
          const savedUserStr = localStorage.getItem("agri_user") || localStorage.getItem("user");
          if (savedUserStr) {
            const parsed = JSON.parse(savedUserStr);
            setUser(parsed);
            setRole((parsed.role as AppRole) || "farmer");
          }
        }
      }
    } catch (err) {
      console.error("fetchCurrentProfile error:", err);
      const savedUserStr = localStorage.getItem("agri_user") || localStorage.getItem("user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setRole((parsed.role as AppRole) || "farmer");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("agri_token") || localStorage.getItem("access_token");
    const savedUserStr = localStorage.getItem("agri_user") || localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setUser(parsed);
          setRole((parsed.role as AppRole) || "farmer");
        } catch {}
      }
      fetchCurrentProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData: any, userToken: string) => {
    localStorage.setItem("agri_token", userToken);
    localStorage.setItem("agri_user", JSON.stringify(userData));
    localStorage.setItem("access_token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    setRole((userData.role as AppRole) || "farmer");
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem("agri_token");
    localStorage.removeItem("agri_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setRole(null);
    setToken(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    const savedToken = localStorage.getItem("agri_token");
    if (savedToken) {
      await fetchCurrentProfile(savedToken);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
