import React, { useEffect, useRef } from "react";
import { cn, formatDate } from "@/lib/utils";
import { Message, User } from "@shared/schema";
import { MessageBubble } from "./ui/message-bubble";
import { Separator } from "@/components/ui/separator";

interface MessageListProps {
  messages: Message[];
  chatMembers: User[];
  className?: string;
}

export function MessageList({
  messages,
  chatMembers,
  className,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group messages by date
  const messagesByDate: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });

  // Get sender for a message
  const getSender = (userId: number): User => {
    return chatMembers.find((member) => member.id === userId) || {
      id: 0,
      username: "Unknown User",
      guest: false,
      createdAt: new Date(),
      lastSeen: new Date(),
    };
  };

  return (
    <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}>
      {Object.entries(messagesByDate).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">
              {formatDate(date)}
            </div>
          </div>

          {dateMessages.map((message, index) => {
            const sender = getSender(message.userId);
            const prevMessage = index > 0 ? dateMessages[index - 1] : null;
            
            // Show avatar only if it's a different sender from the previous message
            const showAvatar = !prevMessage || prevMessage.userId !== message.userId;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                sender={sender}
                showAvatar={showAvatar}
              />
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
