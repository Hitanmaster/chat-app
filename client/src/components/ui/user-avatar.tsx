import React from "react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/contexts/chat-context";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  userId?: number;
  showStatus?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function UserAvatar({
  username,
  avatarUrl,
  size = "md",
  userId,
  showStatus = false,
  className,
  children,
}: UserAvatarProps) {
  const { onlineUsers } = useChat();
  
  const isOnline = userId ? onlineUsers.has(userId) : false;
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size], "bg-zinc-800")}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
        <AvatarFallback className="bg-[#E6FF00] text-zinc-900 font-semibold">
          {getInitials(username)}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && userId && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black",
            isOnline ? "bg-[#E6FF00]" : "bg-zinc-500"
          )}
        />
      )}
      
      {children}
    </div>
  );
}
