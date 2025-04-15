import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { StatusBar } from "@/components/status-bar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BellOff, LogOut } from "lucide-react";
import { ChatWithMembers } from "@shared/schema";
import { formatDate } from "@/lib/utils";

export default function GroupInfo() {
  const { id } = useParams();
  const chatId = parseInt(id);
  const { user } = useAuth();
  
  // Fetch chat details with members
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

  // Get all media messages
  const mediaMessages = chat.messages.filter(
    (message) => message.mediaUrl && message.mediaType
  );

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Header */}
      <div className="p-3 flex items-center border-b border-zinc-800">
        <Link href={`/chat/${chat.id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 h-8 w-8 text-zinc-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h2 className="font-semibold">Group Info</h2>
      </div>
      
      {/* Group profile */}
      <div className="p-6 flex flex-col items-center">
        <UserAvatar
          username={chat.name}
          avatarUrl={chat.avatar || undefined}
          size="xl"
          className="mb-4"
        />
        
        <h2 className="text-xl font-bold mb-1">{chat.name}</h2>
        <p className="text-zinc-500 text-sm">
          Created on {formatDate(chat.createdAt)}
        </p>
      </div>
      
      {/* Media, Files, Links section */}
      <div className="p-4 border-t border-b border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Media, Files & Links</h3>
          <Link href={`/media/${chat.id}`}>
            <Button
              variant="link"
              className="text-[#E6FF00] text-sm p-0 h-auto"
            >
              See All
            </Button>
          </Link>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {mediaMessages.length > 0 ? (
            mediaMessages.slice(0, 3).map((message) => (
              <Link href={`/media/${chat.id}/view/${message.id}`} key={message.id}>
                <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={message.mediaUrl!}
                    alt="Media"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            ))
          ) : (
            <div className="w-full text-center py-4 text-zinc-500">
              No media shared yet
            </div>
          )}
          
          {mediaMessages.length > 3 && (
            <Link href={`/media/${chat.id}`}>
              <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img
                  src={mediaMessages[3].mediaUrl!}
                  alt="Media"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <span className="text-white font-semibold">+{mediaMessages.length - 3}</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
      
      {/* Members section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{chat.members.length} Members</h3>
            <Button
              variant="link"
              className="text-[#E6FF00] text-sm p-0 h-auto"
            >
              Add Member
            </Button>
          </div>
          
          {chat.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserAvatar
                  username={member.username}
                  avatarUrl={member.avatar || undefined}
                  userId={member.id}
                  showStatus={true}
                />
                <div>
                  <h4 className="font-medium">
                    {member.id === user?.id ? "You" : member.username}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    {member.id === chat.createdBy ? "Group Admin" : member.bio || "Member"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-zinc-800 space-y-4">
        <Button
          variant="outline"
          className="w-full py-3 justify-center space-x-2 bg-zinc-800 border-none hover:bg-zinc-700"
        >
          <BellOff className="h-5 w-5 text-zinc-500" />
          <span>Mute Notifications</span>
        </Button>
        
        <Button
          variant="outline"
          className="w-full py-3 justify-center space-x-2 bg-zinc-800 border-none hover:bg-zinc-700 text-red-400 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span>Leave Group</span>
        </Button>
      </div>
    </div>
  );
}
