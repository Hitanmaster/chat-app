import React from "react";
import { cn, formatTime } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";
import { Message, User } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

interface MessageBubbleProps {
  message: Message;
  sender: User;
  className?: string;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  sender,
  className,
  showAvatar = true,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isCurrentUser = user?.id === message.userId;
  
  const renderContent = () => {
    if (message.mediaUrl && message.mediaType === "image") {
      return (
        <div className="overflow-hidden rounded-xl rounded-bl-sm">
          <img 
            src={message.mediaUrl} 
            alt="Media attachment" 
            className="w-full h-36 object-cover"
          />
          {message.text && (
            <div className="p-3">
              <p className="text-sm">{message.text}</p>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className={cn(
        "p-3 rounded-xl",
        isCurrentUser 
          ? "bg-[#E6FF00] text-zinc-900 rounded-br-sm" 
          : "bg-zinc-800 rounded-bl-sm"
      )}>
        <p className="text-sm">{message.text}</p>
      </div>
    );
  };
  
  const renderReactions = () => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) {
      return null;
    }
    
    return (
      <div className="absolute -bottom-2 -right-2 bg-zinc-900 rounded-full px-2 py-1 flex space-x-1 border border-zinc-800">
        {Object.entries(message.reactions).map(([reaction, count]) => (
          <span key={reaction}>{reaction} <span className="text-xs text-zinc-500">{count}</span></span>
        ))}
      </div>
    );
  };

  if (isCurrentUser) {
    return (
      <div className={cn(
        "flex flex-row-reverse items-end space-x-reverse space-x-2 max-w-xs ml-auto", 
        className
      )}>
        <div className="flex flex-col items-end">
          <div className="relative">
            {renderContent()}
            {renderReactions()}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{formatTime(message.createdAt)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end space-x-2 max-w-xs", className)}>
      {showAvatar && (
        <UserAvatar
          username={sender.username}
          avatarUrl={sender.avatar || undefined}
          size="sm"
          userId={sender.id}
        />
      )}
      
      <div>
        <div className="text-xs text-zinc-500 mb-1">{sender.username}</div>
        <div className="relative">
          {renderContent()}
          {renderReactions()}
        </div>
        <div className="text-xs text-zinc-500 mt-1">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
}
