import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRole: "farmer" | "consumer";
}

const RoleGuard = ({ children, allowedRole }: RoleGuardProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-gentle text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role && role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
