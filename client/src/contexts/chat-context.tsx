import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Chat, Message, User, ChatWithLastMessage, ChatWithMembers, WebSocketMessage } from "@shared/schema";
import { socketClient } from "@/lib/socket";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatContextType {
  activeChatId: number | null;
  setActiveChatId: (id: number | null) => void;
  sendMessage: (chatId: number, text: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  addReaction: (messageId: number, reaction: string) => void;
  createChat: (name: string, members: number[], isGroup: boolean) => Promise<Chat>;
  markUserOnline: (userId: number) => void;
  markUserOffline: (userId: number) => void;
  onlineUsers: Set<number>;
}

const ChatContext = createContext<ChatContextType>({
  activeChatId: null,
  setActiveChatId: () => {},
  sendMessage: async () => {},
  addReaction: () => {},
  createChat: async () => {
    throw new Error("Chat context not initialized");
  },
  markUserOnline: () => {},
  markUserOffline: () => {},
  onlineUsers: new Set(),
});

export function useChat() {
  return useContext(ChatContext);
}

interface ChatProviderProps {
  children: ReactNode;
  user?: User | null;
}

export function ChatProvider({ children, user = null }: ChatProviderProps) {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!user) return;

    // Setup the WebSocket event listeners
    const setupWebSocketListeners = () => {
      // Handle new messages
      const unsubscribeNewMessage = socketClient.on("new_message", (payload) => {
        const { chatId, message } = payload;
        
        // Update the chat's messages
        queryClient.setQueryData([`/api/chats/${chatId}`], (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            messages: [...oldData.messages, message],
          };
        });
        
        // Update the chat list
        queryClient.setQueryData(['/api/chats', { userId: user.id }], (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((chat: ChatWithLastMessage) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                lastMessage: message,
                unreadCount: activeChatId === chatId ? 0 : (chat.unreadCount || 0) + 1,
              };
            }
            return chat;
          });
        });
      });
      
      // Handle message reactions
      const unsubscribeMessageReaction = socketClient.on("message_reaction", (payload) => {
        const { messageId, userId, reaction, updatedReactions } = payload;
        
        // Find which chat contains this message
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      });
      
      // Handle user status updates
      const unsubscribeUserStatus = socketClient.on("user_status", (payload) => {
        const { userId, status } = payload;
        
        if (status === 'online') {
          markUserOnline(userId);
        } else {
          markUserOffline(userId);
        }
      });

      return {
        unsubscribeNewMessage,
        unsubscribeMessageReaction,
        unsubscribeUserStatus,
      };
    };

    // Fetch initial online users
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/api/users/online');
        const users = await response.json();
        
        const onlineUserIds = users
          .filter((u: any) => u.status === 'online')
          .map((u: any) => u.id);
        
        setOnlineUsers(new Set(onlineUserIds));
      } catch (err) {
        console.error('Failed to fetch online users', err);
      }
    };

    // Run our initialization
    fetchOnlineUsers();
    const { unsubscribeNewMessage, unsubscribeMessageReaction, unsubscribeUserStatus } = setupWebSocketListeners();

    // Cleanup function
    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageReaction();
      unsubscribeUserStatus();
    };
  }, [user, queryClient, activeChatId]);

  const sendMessage = async (chatId: number, text: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) return;
    
    try {
      // Send via WebSocket for real-time
      socketClient.send("message", {
        chatId,
        text,
        mediaUrl,
        mediaType,
      });
      
      // Also send via API as fallback
      await apiRequest("POST", "/api/messages", {
        chatId,
        userId: user.id,
        text,
        mediaUrl,
        mediaType,
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addReaction = (messageId: number, reaction: string) => {
    if (!user) return;
    
    socketClient.send("reaction", {
      messageId,
      reaction,
    });
  };

  const createChat = async (name: string, members: number[], isGroup: boolean): Promise<Chat> => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await apiRequest("POST", "/api/chats", {
        name,
        isGroup,
        createdBy: user.id,
        members: [...members, user.id],
      });
      
      const newChat = await response.json();
      
      // Invalidate chats query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      return newChat;
    } catch (error) {
      toast({
        title: "Error creating chat",
        description: "Failed to create new chat.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markUserOnline = (userId: number) => {
    setOnlineUsers(prev => {
      const updated = new Set(prev);
      updated.add(userId);
      return updated;
    });
  };

  const markUserOffline = (userId: number) => {
    setOnlineUsers(prev => {
      const updated = new Set(prev);
      updated.delete(userId);
      return updated;
    });
  };

  return (
    <ChatContext.Provider
      value={{
        activeChatId,
        setActiveChatId,
        sendMessage,
        addReaction,
        createChat,
        markUserOnline,
        markUserOffline,
        onlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
