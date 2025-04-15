import React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  MessageSquare,
  Search,
  Circle,
  User,
} from "lucide-react";

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className={cn("bg-zinc-900 border-t border-zinc-800 p-3 flex justify-around", className)}>
      <Link href="/home">
        <a className={cn("flex flex-col items-center", isActive("/home") ? "text-[#E6FF00]" : "text-zinc-500")}>
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Chats</span>
        </a>
      </Link>

      <Link href="/search">
        <a className={cn("flex flex-col items-center", isActive("/search") ? "text-[#E6FF00]" : "text-zinc-500")}>
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Search</span>
        </a>
      </Link>

      <Link href="/stories">
        <a className={cn("flex flex-col items-center", isActive("/stories") ? "text-[#E6FF00]" : "text-zinc-500")}>
          <Circle className="h-5 w-5" />
          <span className="text-xs mt-1">Stories</span>
        </a>
      </Link>

      <Link href="/profile">
        <a className={cn("flex flex-col items-center", isActive("/profile") ? "text-[#E6FF00]" : "text-zinc-500")}>
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </a>
      </Link>
    </div>
  );
}
