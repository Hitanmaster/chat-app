import React from "react";
import { cn, truncateText, formatDate } from "@/lib/utils";
import { ChatWithLastMessage, User } from "@shared/schema";
import { UserAvatar } from "./ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";

interface ChatListItemProps {
  chat: ChatWithLastMessage;
  className?: string;
}

export function ChatListItem({ chat, className }: ChatListItemProps) {
  const { user } = useAuth();
  
  // For 1-on-1 chats, display the other user's name
  const displayName = chat.name;
  
  // Determine if this user is online - in a real app, this would come from an API
  const isOnline = !chat.isGroup && Math.random() > 0.5;
  
  // For the last message, show the sender's name for group chats
  const lastMessageText = chat.lastMessage
    ? chat.isGroup && chat.lastMessage.userId !== user?.id
      ? `${chat.lastMessage.userId}: ${chat.lastMessage.text}`
      : chat.lastMessage.text || "Shared a media"
    : "No messages yet";
  
  return (
    <Link href={`/chat/${chat.id}`}>
      <div className={cn(
        "p-4 border-b border-zinc-800 flex items-center space-x-3 hover:bg-zinc-900 cursor-pointer",
        className
      )}>
        <div className="relative">
          <UserAvatar
            username={displayName}
            avatarUrl={chat.avatar || undefined}
            showStatus={!chat.isGroup}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{displayName}</h3>
            <span className="text-xs text-zinc-500">
              {chat.lastMessage ? formatDate(chat.lastMessage.createdAt) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-zinc-500 truncate w-48">
              {truncateText(lastMessageText || "", 40)}
            </p>
            {chat.unreadCount > 0 && (
              <Badge variant="outline" className="bg-[#E6FF00] text-zinc-900 text-xs rounded-full w-5 h-5 flex items-center justify-center px-0">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
