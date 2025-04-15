import React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./ui/user-avatar";
import { Chat, User } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Video, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  chat: Chat;
  members: User[];
  className?: string;
}

export function ChatHeader({ chat, members, className }: ChatHeaderProps) {
  return (
    <div
      className={cn(
        "p-3 flex items-center space-x-3 border-b border-zinc-800",
        className
      )}
    >
      <Link href="/home">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-500 h-8 w-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>

      <Link href={`/group/${chat.id}`}>
        <div className="flex items-center space-x-3 flex-1">
          <UserAvatar
            username={chat.name}
            avatarUrl={chat.avatar || undefined}
            userId={chat.isGroup ? undefined : members.find(m => m.username === chat.name)?.id}
            showStatus={!chat.isGroup && members.length === 2}
          />

          <div className="flex-1">
            <h2 className="font-semibold">{chat.name}</h2>
            {chat.isGroup && (
              <p className="text-xs text-zinc-500">
                {members.map(m => m.username).join(", ")}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="flex space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-500 h-8 w-8"
        >
          <Video className="h-5 w-5" />
        </Button>
        
        <Link href={`/group/${chat.id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-500 h-8 w-8"
          >
            <InfoIcon className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
