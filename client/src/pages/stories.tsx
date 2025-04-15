import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "@/components/status-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { StoryCircle } from "@/components/story-circle";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatTimeAgo } from "@/lib/utils";
import { Story, User } from "@shared/schema";

interface StoryGroup {
  user: User;
  stories: Story[];
  viewed: boolean;
}

export default function Stories() {
  const { user } = useAuth();
  
  // Fetch active stories
  const { data: stories = [], isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !!user,
  });
  
  // Fetch users for stories
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users/online'],
    enabled: !!user,
  });
  
  // Group stories by user
  const groupedStories: StoryGroup[] = [];
  
  // Add current user with "add story" option
  if (user) {
    groupedStories.push({
      user,
      stories: [],
      viewed: false
    });
  }
  
  // Group stories by user and sort by time
  const storiesByUser = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      const storyUser = users.find(u => u.id === story.userId);
      if (storyUser) {
        acc[story.userId] = {
          user: storyUser,
          stories: [],
          viewed: false // In a real app, this would be based on view status
        };
      }
    }
    
    if (acc[story.userId]) {
      acc[story.userId].stories.push(story);
    }
    
    return acc;
  }, {} as Record<number, StoryGroup>);
  
  // Convert to array and separate viewed/unviewed
  const recentStories: StoryGroup[] = [];
  const viewedStories: StoryGroup[] = [];
  
  Object.values(storiesByUser).forEach(group => {
    // Sort stories by creation time
    group.stories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    if (group.viewed) {
      viewedStories.push(group);
    } else {
      recentStories.push(group);
    }
  });
  
  // Mock viewed stories data for visual completeness
  if (viewedStories.length === 0 && users.length > 0) {
    // In a real app, we'd use actual viewed stories data
    // This is just for the UI demonstration
    const viewedUser1 = users.find(u => u.id !== user?.id && !recentStories.some(g => g.user.id === u.id));
    const viewedUser2 = users.find(u => u.id !== user?.id && u.id !== viewedUser1?.id && !recentStories.some(g => g.user.id === u.id));
    
    if (viewedUser1) {
      viewedStories.push({
        user: viewedUser1,
        stories: [],
        viewed: true
      });
    }
    
    if (viewedUser2) {
      viewedStories.push({
        user: viewedUser2,
        stories: [],
        viewed: true
      });
    }
  }
  
  const handleCreateStory = () => {
    // In a real app, this would open camera/file picker
    console.log("Create story");
  };
  
  const handleViewStory = (storyGroup: StoryGroup) => {
    // In a real app, this would open story viewer
    console.log("View story", storyGroup);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-800">
        <h2 className="font-semibold">Stories</h2>
        <Button
          size="icon"
          className="w-10 h-10 bg-[#E6FF00] rounded-full"
          onClick={handleCreateStory}
        >
          <Camera className="h-5 w-5 text-black" />
        </Button>
      </div>
      
      {/* Story grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Your story */}
        <div className="mb-6">
          <h3 className="text-zinc-500 uppercase text-xs font-semibold mb-3">
            Your Story
          </h3>
          
          <div className="flex items-center space-x-3" onClick={handleCreateStory}>
            <StoryCircle
              user={user!}
              isMe={true}
            />
            <div>
              <h4 className="font-medium">Add to Your Story</h4>
              <p className="text-xs text-zinc-500">
                Share a photo or write something
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent stories */}
        {recentStories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-zinc-500 uppercase text-xs font-semibold mb-3">
              Recent Stories
            </h3>
            
            {recentStories.map(storyGroup => (
              <div 
                key={storyGroup.user.id} 
                className="flex items-center space-x-3 mb-4"
                onClick={() => handleViewStory(storyGroup)}
              >
                <UserAvatar
                  username={storyGroup.user.username}
                  avatarUrl={storyGroup.user.avatar || undefined}
                  userId={storyGroup.user.id}
                  showStatus={true}
                  size="xl"
                  className="border-2 border-[#E6FF00] rounded-full"
                />
                <div>
                  <h4 className="font-medium">{storyGroup.user.username}</h4>
                  <p className="text-xs text-zinc-500">
                    {storyGroup.stories.length > 0
                      ? formatTimeAgo(storyGroup.stories[0].createdAt)
                      : "Just now"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Viewed stories */}
        {viewedStories.length > 0 && (
          <div>
            <h3 className="text-zinc-500 uppercase text-xs font-semibold mb-3">
              Viewed
            </h3>
            
            {viewedStories.map(storyGroup => (
              <div 
                key={storyGroup.user.id} 
                className="flex items-center space-x-3 mb-4"
                onClick={() => handleViewStory(storyGroup)}
              >
                <UserAvatar
                  username={storyGroup.user.username}
                  avatarUrl={storyGroup.user.avatar || undefined}
                  userId={storyGroup.user.id}
                  showStatus={true}
                  size="xl"
                  className="border-2 border-zinc-500 rounded-full"
                />
                <div>
                  <h4 className="font-medium">{storyGroup.user.username}</h4>
                  <p className="text-xs text-zinc-500">
                    {storyGroup.stories.length > 0
                      ? formatTimeAgo(storyGroup.stories[0].createdAt)
                      : "Yesterday"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}
