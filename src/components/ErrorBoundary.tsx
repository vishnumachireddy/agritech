// Global React Error Boundary for AgroSmart AI
// Prevents blank/white screens by catching any unhandled runtime render exceptions,
// providing a user-friendly recovery interface in English and Telugu.

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem("agri_token");
      localStorage.removeItem("agri_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    } catch (e) {
      // Ignored
    }
    window.location.href = "/auth/login";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isTelugu =
        typeof window !== "undefined" &&
        localStorage.getItem("agri-language") === "te";

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
          <div className="max-w-md w-full bg-card border border-border/80 rounded-2xl shadow-xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">
                {isTelugu
                  ? "సమస్య ఎదురైంది (Something went wrong)"
                  : "Something went wrong"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isTelugu
                  ? "పేజీని లోడ్ చేయడంలో చిన్న లోపం జరిగింది. పేజీని రీలోడ్ చేసి మళ్లీ ప్రయత్నించండి."
                  : "An unexpected error occurred while rendering this page. You can safely reload the page or return to the home screen."}
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-3 bg-muted rounded-lg text-left overflow-auto max-h-32 text-[11px] font-mono text-destructive">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={this.handleReload}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <RotateCcw className="w-4 h-4" />
                {isTelugu ? "పేజీ రీలోడ్ చేయండి" : "Reload Page"}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Home className="w-3.5 h-3.5" />
                  {isTelugu ? "హోమ్ పేజీ" : "Home"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={this.handleClearAndReset}
                  className="flex-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isTelugu ? "లాగిన్ రీసెట్" : "Reset Session"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
