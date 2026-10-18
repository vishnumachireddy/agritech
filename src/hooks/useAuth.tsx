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
  loading: false,
  login: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Synchronous optimistic hydration from localStorage for 0ms initial load
  const getInitialState = () => {
    if (typeof window === "undefined") {
      return { user: null, role: null, token: null };
    }
    const savedToken =
      localStorage.getItem("agri_token") || localStorage.getItem("access_token");
    const savedUserStr =
      localStorage.getItem("agri_user") || localStorage.getItem("user");

    if (savedToken && savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        return {
          user: parsed,
          role: (parsed.role as AppRole) || "farmer",
          token: savedToken,
        };
      } catch (e) {
        // Ignored
      }
    }
    return { user: null, role: null, token: savedToken || null };
  };

  const initial = getInitialState();
  const [user, setUser] = useState<any>(initial.user);
  const [role, setRole] = useState<AppRole | null>(initial.role);
  const [token, setToken] = useState<string | null>(initial.token);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCurrentProfile = async (storedToken: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout max, never hang for 1 min!

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
        setRole((profile.role as AppRole) || "farmer");
        localStorage.setItem("agri_user", JSON.stringify(profile));
      } else if (res.status === 401) {
        // Token is invalid/expired - clear stale auth keys cleanly
        localStorage.removeItem("agri_token");
        localStorage.removeItem("agri_user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
        setRole(null);
        setToken(null);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Server asleep or network slow: retain cached user session safely
      console.warn(
        "Background profile check timed out or offline:",
        err.name || err.message
      );
    }
  };

  useEffect(() => {
    const savedToken =
      localStorage.getItem("agri_token") || localStorage.getItem("access_token");
    if (savedToken) {
      fetchCurrentProfile(savedToken);
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
    const savedToken =
      localStorage.getItem("agri_token") || localStorage.getItem("access_token");
    if (savedToken) {
      await fetchCurrentProfile(savedToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, role, token, loading, login, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
