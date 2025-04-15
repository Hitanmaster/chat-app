import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBar } from "@/components/status-bar";
import { Phone, Mail, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleContinueWithPhone = () => {
    setShowProfileSetup(true);
  };

  const handleContinueWithEmail = () => {
    setShowProfileSetup(true);
  };

  const handleContinueAsGuest = () => {
    setIsLoading(true);
    // Simulate loading process
    setTimeout(() => {
      toast({
        title: "Welcome to NeonChat!",
        description: "This is a demo version. Authentication will be implemented soon.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleCompleteProfile = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Simulate loading process
    setTimeout(() => {
      toast({
        title: "Welcome to NeonChat!",
        description: `Profile created for ${username}. This is a demo version.`,
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />

      {!showProfileSetup ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-[#E6FF00] rounded-full flex items-center justify-center mb-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <path d="M13 3v18" />
              <path d="M5 3L3 7l5 5-5 5 2 4 8-8-8-8z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Welcome to NeonChat</h1>
          <p className="text-zinc-500 text-center mb-10">
            Connect with friends and groups instantly
          </p>

          <div className="w-full space-y-4 mb-8">
            <Button
              onClick={handleContinueWithPhone}
              className="w-full bg-[#E6FF00] text-black hover:bg-[#E6FF00]/90 py-6 h-auto"
            >
              <Phone className="mr-2 h-5 w-5" /> Continue with Phone
            </Button>

            <Button
              onClick={handleContinueWithEmail}
              className="w-full bg-zinc-800 text-white hover:bg-zinc-700 py-6 h-auto"
            >
              <Mail className="mr-2 h-5 w-5" /> Continue with Email
            </Button>

            <Button
              onClick={handleContinueAsGuest}
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800 py-6 h-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <User className="mr-2 h-5 w-5" />
              )}
              Continue as Guest
            </Button>
          </div>

          <p className="text-xs text-zinc-500 text-center">
            By continuing, you agree to our{" "}
            <span className="text-[#E6FF00]">Terms of Service</span> and{" "}
            <span className="text-[#E6FF00]">Privacy Policy</span>
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6">
          <h2 className="text-xl font-bold mb-6">Set Up Your Profile</h2>

          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-zinc-500" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#E6FF00] rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-zinc-500 text-sm mb-2">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border-none rounded-xl p-3 text-white"
              placeholder="Choose a username"
            />
          </div>

          <div className="mb-10">
            <label className="block text-zinc-500 text-sm mb-2">
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-zinc-800 border-none rounded-xl p-3 text-white h-20 focus:ring-[#E6FF00] focus:ring-1 focus:outline-none"
              placeholder="Tell us about yourself"
            />
          </div>

          <Button
            onClick={handleCompleteProfile}
            className="w-full bg-[#E6FF00] text-black hover:bg-[#E6FF00]/90 py-6 h-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-black" />
                Creating Profile...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
