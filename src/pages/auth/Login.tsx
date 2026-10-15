import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { API_BASE } from "@/config";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.full_name || 'User'}!`);

      if (data.user?.role === "consumer") {
        navigate("/consumer/dashboard");
      } else {
        navigate("/farmer/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.full_name || 'User'}!`);

      if (data.user?.role === "consumer") {
        navigate("/consumer/dashboard");
      } else {
        navigate("/farmer/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full agri-gradient flex items-center justify-center mb-2">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <CardTitle className="font-display text-2xl">Welcome to AgriAssist</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* 1-Click Demo Login Shortcuts */}
          <div className="mt-6 pt-5 border-t border-border space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              Quick 1-Click Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium border-primary/40 hover:bg-primary/10 hover:text-primary flex flex-col h-auto py-2"
                onClick={() => loginWithDemo("farmer@agri.com", "farmer123")}
                disabled={loading}
              >
                <span className="font-bold text-foreground">🚜 Farmer (Producer)</span>
                <span className="text-[10px] text-muted-foreground">farmer@agri.com</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-medium border-foreground/30 hover:bg-muted hover:text-foreground flex flex-col h-auto py-2"
                onClick={() => loginWithDemo("consumer@agri.com", "consumer123")}
                disabled={loading}
              >
                <span className="font-bold text-foreground">🛒 Consumer</span>
                <span className="text-[10px] text-muted-foreground">consumer@agri.com</span>
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-primary underline">Create Account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
