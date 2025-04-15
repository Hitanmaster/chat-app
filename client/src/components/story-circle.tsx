import React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./ui/user-avatar";
import { Story, User } from "@shared/schema";

interface StoryCircleProps {
  user: User;
  hasActiveStory?: boolean;
  isMe?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StoryCircle({
  user,
  hasActiveStory = false,
  isMe = false,
  onClick,
  className,
}: StoryCircleProps) {
  return (
    <div
      className={cn("flex flex-col items-center", className)}
      onClick={onClick}
    >
      <div className="relative">
        <UserAvatar
          username={user.username}
          avatarUrl={user.avatar || undefined}
          size="xl"
          className={hasActiveStory ? "border-2 border-[#E6FF00] rounded-full" : ""}
        >
          {isMe && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#E6FF00] rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-900"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
          )}
        </UserAvatar>
      </div>
      <span className="text-xs text-zinc-500 mt-1">{isMe ? "Your story" : user.username}</span>
    </div>
  );
}
