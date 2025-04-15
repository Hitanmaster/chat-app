import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { socketClient } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string) => Promise<User>;
  signInAsGuest: () => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user from localStorage
  useEffect(() => {
    try {
      console.log("AuthProvider: Checking for stored user...");
      const storedUser = localStorage.getItem("neonChat.user");
      
      if (storedUser) {
        console.log("AuthProvider: Found stored user, parsing...");
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          console.log("AuthProvider: Successfully parsed user", parsedUser);
          setUser(parsedUser);
          
          // Connect to WebSocket
          console.log(`AuthProvider: Connecting WebSocket for user ID ${parsedUser.id}`);
          socketClient.connect(parsedUser.id);
        } catch (error) {
          console.error("AuthProvider: Error parsing stored user:", error);
          localStorage.removeItem("neonChat.user");
        }
      } else {
        console.log("AuthProvider: No stored user found");
      }
    } catch (error) {
      console.error("AuthProvider: Error in useEffect:", error);
    } finally {
      console.log("AuthProvider: Setting loading to false");
      setLoading(false);
    }
  }, []);

  const signIn = async (username: string): Promise<User> => {
    try {
      console.log(`AuthProvider: Signing in with username: ${username}`);
      const userData: InsertUser = {
        username,
        avatar: null,
        bio: null,
        guest: false,
      };

      console.log("AuthProvider: Sending API request to create user");
      const response = await apiRequest("POST", "/api/users", userData);
      const newUser = await response.json();
      console.log("AuthProvider: Created new user:", newUser);
      
      setUser(newUser);
      localStorage.setItem("neonChat.user", JSON.stringify(newUser));
      
      // Connect to WebSocket
      console.log(`AuthProvider: Connecting WebSocket for new user ID ${newUser.id}`);
      socketClient.connect(newUser.id);
      
      return newUser;
    } catch (error) {
      console.error("AuthProvider: Error signing in:", error);
      toast({
        title: "Error signing in",
        description: "Failed to create user account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInAsGuest = async (): Promise<User> => {
    try {
      console.log("AuthProvider: Signing in as guest");
      const guestName = `Guest_${Math.floor(Math.random() * 10000)}`;
      const userData: InsertUser = {
        username: guestName,
        avatar: null,
        bio: null,
        guest: true,
      };

      console.log("AuthProvider: Sending API request to create guest user");
      const response = await apiRequest("POST", "/api/users", userData);
      const newUser = await response.json();
      console.log("AuthProvider: Created new guest user:", newUser);
      
      setUser(newUser);
      localStorage.setItem("neonChat.user", JSON.stringify(newUser));
      
      // Connect to WebSocket
      console.log(`AuthProvider: Connecting WebSocket for new guest user ID ${newUser.id}`);
      socketClient.connect(newUser.id);
      
      return newUser;
    } catch (error) {
      console.error("AuthProvider: Error signing in as guest:", error);
      toast({
        title: "Error signing in as guest",
        description: "Failed to create guest account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = () => {
    console.log("AuthProvider: Signing out");
    
    // Disconnect WebSocket
    socketClient.disconnect();
    
    // Clear user data
    setUser(null);
    localStorage.removeItem("neonChat.user");
    
    console.log("AuthProvider: Successfully signed out");
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    signIn,
    signInAsGuest,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
