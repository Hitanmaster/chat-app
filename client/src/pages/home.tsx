import React, { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/contexts/chat-context";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "@/components/status-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { ChatListItem } from "@/components/chat-list-item";
import { StoryCircle } from "@/components/story-circle";
import { Button } from "@/components/ui/button";
import { Search, Edit } from "lucide-react";
import { Link } from "wouter";
import { ChatWithLastMessage, User } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { setActiveChatId } = useChat();
  
  // Clear any active chat when coming to the home page
  useEffect(() => {
    setActiveChatId(null);
  }, [setActiveChatId]);
  
  // Fetch chats for the current user
  const { data: chats = [], isLoading: isLoadingChats } = useQuery<ChatWithLastMessage[]>({
    queryKey: ['/api/chats', { userId: user?.id }],
    enabled: !!user,
  });
  
  // Fetch active stories
  const { data: stories = [], isLoading: isLoadingStories } = useQuery<any[]>({
    queryKey: ['/api/stories'],
    enabled: !!user,
  });
  
  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return acc;
  }, {} as Record<number, any[]>);
  
  // Get unique users with stories
  const usersWithStories: User[] = [];
  Object.keys(storiesByUser).forEach((userId) => {
    const numericId = parseInt(userId);
    if (!usersWithStories.some(u => u.id === numericId)) {
      // In a real app, we would fetch user details here
      usersWithStories.push({
        id: numericId,
        username: `User ${numericId}`,
        guest: false,
        createdAt: new Date(),
        lastSeen: new Date(),
      });
    }
  });

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chats</h1>
        <div className="flex items-center space-x-3">
          <Link href="/search">
            <Button size="icon" className="w-10 h-10 bg-zinc-800 rounded-full">
              <Search className="h-5 w-5 text-zinc-500" />
            </Button>
          </Link>
          <Button size="icon" className="w-10 h-10 bg-[#E6FF00] rounded-full">
            <Edit className="h-5 w-5 text-black" />
          </Button>
        </div>
      </div>
      
      {/* Stories row */}
      <div className="px-4 py-2">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {/* Your story */}
          <StoryCircle
            user={user!}
            isMe={true}
            onClick={() => {}}
          />
          
          {/* Other users' stories */}
          {usersWithStories.map((storyUser) => (
            <StoryCircle
              key={storyUser.id}
              user={storyUser}
              hasActiveStory={true}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
      
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingChats ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E6FF00]"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
            <p>No chats yet</p>
            <p className="text-sm">Start a conversation by tapping the edit button</p>
          </div>
        ) : (
          chats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} />
          ))
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}
