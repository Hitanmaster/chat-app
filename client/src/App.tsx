import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import GroupInfo from "@/pages/group-info";
import MediaPreview from "@/pages/media-preview";
import MediaViewer from "@/pages/media-viewer";
import Search from "@/pages/search";
import Stories from "@/pages/stories";
import { useAuth } from "./contexts/auth-context";
import { useEffect, Suspense, useState } from "react";
import { useLocation } from "wouter";

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#E6FF00] mb-4"></div>
      <p className="text-white text-lg">Loading NeonChat...</p>
    </div>
  );
}

function Router() {
  // Create a safe version of routes that don't depend on auth first
  const SafeRoutes = () => {
    const [location, setLocation] = useLocation();
    
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/" component={Onboarding} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  };
  
  // Create a version of routes that depend on auth
  const AuthenticatedRoutes = () => {
    const { user, loading } = useAuth();
    const [location, setLocation] = useLocation();
    const [authChecked, setAuthChecked] = useState(false);
    
    // This useEffect handles redirects based on authentication state
    useEffect(() => {
      console.log("Router: Auth state check", { user, loading, location });
      
      if (loading) return;
      
      // Mark that we've checked authentication
      if (!authChecked) {
        setAuthChecked(true);
      }
      
      // Redirect to onboarding if not authenticated
      if (!user && location !== '/') {
        console.log("Router: Redirecting to onboarding (not authenticated)");
        setLocation('/');
        return;
      }
      
      // Redirect to home if authenticated and at onboarding
      if (user && location === '/') {
        console.log("Router: Redirecting to home (already authenticated)");
        setLocation('/home');
        return;
      }
    }, [user, location, setLocation, loading, authChecked]);

    // Show loading spinner while auth state is being determined
    if (loading || !authChecked) {
      console.log("Router: Showing loading spinner", { loading, authChecked });
      return <LoadingSpinner />;
    }

    console.log("Router: Rendering routes", { user, location });
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/" component={Onboarding} />
          <Route path="/home" component={Home} />
          <Route path="/chat/:id" component={Chat} />
          <Route path="/profile" component={Profile} />
          <Route path="/group/:id" component={GroupInfo} />
          <Route path="/media/:id" component={MediaPreview} />
          <Route path="/media/:id/view/:mediaId" component={MediaViewer} />
          <Route path="/search" component={Search} />
          <Route path="/stories" component={Stories} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  };
  
  // For now, let's use the safe routes to avoid auth context issues
  return <SafeRoutes />;
}

function App() {
  // The App component doesn't directly use hooks
  // It just renders Router which will handle auth checking
  return <Router />;
}

export default App;
