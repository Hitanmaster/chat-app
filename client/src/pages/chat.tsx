import React, { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/contexts/chat-context";
import { StatusBar } from "@/components/status-bar";
import { ChatHeader } from "@/components/chat-header";
import { MessageList } from "@/components/message-list";
import { ChatInput } from "@/components/chat-input";
import { ChatWithMembers } from "@shared/schema";

export default function Chat() {
  const { id } = useParams();
  const chatId = parseInt(id);
  const { user } = useAuth();
  const { setActiveChatId } = useChat();
  
  // Set the active chat ID for notifications
  useEffect(() => {
    setActiveChatId(chatId);
    
    return () => {
      setActiveChatId(null);
    };
  }, [chatId, setActiveChatId]);
  
  // Fetch chat details with members and messages
  const { data: chat, isLoading } = useQuery<ChatWithMembers>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !isNaN(chatId) && !!user,
  });

  if (isLoading || !chat) {
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
      <ChatHeader 
        chat={chat} 
        members={chat.members} 
      />
      <MessageList 
        messages={chat.messages} 
        chatMembers={chat.members}
      />
      <ChatInput chatId={chat.id} />
    </div>
  );
}
