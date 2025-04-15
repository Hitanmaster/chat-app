import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { StatusBar } from "@/components/status-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, UserIcon, Lock, Bell, Moon, Palette, LogOut, QrCode, PencilIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full bg-black">
        <StatusBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E6FF00]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-800">
        <h2 className="font-semibold">Profile</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <QrCode className="h-5 w-5 text-zinc-500" />
        </Button>
      </div>
      
      {/* Profile section */}
      <div className="p-6 flex flex-col items-center border-b border-zinc-800">
        <div className="relative mb-4">
          <UserAvatar
            username={user.username}
            avatarUrl={user.avatar || undefined}
            size="xl"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-0 right-0 w-8 h-8 bg-zinc-800 rounded-full"
            >
              <PencilIcon className="h-4 w-4 text-zinc-500" />
            </Button>
          </UserAvatar>
        </div>
        
        <h2 className="text-xl font-bold mb-1">{user.username}</h2>
        <p className="text-zinc-500 text-sm">{user.bio || "No bio yet"}</p>
      </div>
      
      {/* Settings sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-zinc-500 uppercase text-xs font-semibold mb-3">Account</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-zinc-500" />
                </div>
                <span>Personal Info</span>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <span>Privacy & Security</span>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5 text-zinc-500" />
                </div>
                <span>Notifications</span>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-zinc-500 uppercase text-xs font-semibold mb-3">Appearance</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Moon className="h-5 w-5 text-zinc-500" />
                </div>
                <span>Dark Mode</span>
              </div>
              <Switch checked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Palette className="h-5 w-5 text-zinc-500" />
                </div>
                <span>Theme</span>
              </div>
              <div className="w-6 h-6 bg-[#E6FF00] rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-zinc-800"
            onClick={handleLogout}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-400" />
              </div>
              <span>Log Out</span>
            </div>
          </Button>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
