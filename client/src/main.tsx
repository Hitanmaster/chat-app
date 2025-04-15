import { createRoot } from "react-dom/client";
import React, { Component, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white flex-col p-4">
      <h1 className="text-xl font-bold mb-4">Something went wrong:</h1>
      <p className="text-red-500 mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-[#E6FF00] text-black font-bold rounded"
      >
        Reload Page
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error as Error} />;
    }
    return this.props.children;
  }
}

// Simple layout wrapper
function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-md mx-auto h-screen bg-black overflow-hidden">
      {children}
    </div>
  );
}

// App wrapper with minimal provider structure
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppLayout>
            <App />
            <Toaster />
          </AppLayout>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
