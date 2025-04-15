import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { StatusBar } from "@/components/status-bar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChatWithMembers } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGrid } from "@/components/media-grid";

export default function MediaPreview() {
  const { id } = useParams();
  const chatId = parseInt(id);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("media");
  
  // Fetch chat details with messages
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

  // Filter messages by media type
  const mediaMessages = chat.messages
    .filter((message) => message.mediaUrl && message.mediaType)
    .map((message) => ({
      id: message.id,
      url: message.mediaUrl!,
      type: message.mediaType as "image" | "video",
      caption: message.text,
    }));

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Header */}
      <div className="p-3 flex items-center border-b border-zinc-800">
        <Link href={`/group/${chat.id}`}>
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 h-8 w-8 text-zinc-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h2 className="font-semibold">{chat.name} Media</h2>
      </div>
      
      {/* Media tabs */}
      <Tabs
        defaultValue="media"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full rounded-none border-b border-zinc-800 bg-transparent">
          <TabsTrigger
            value="media"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
          >
            Files
          </TabsTrigger>
          <TabsTrigger
            value="links"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
          >
            Links
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="media" className="flex-1 overflow-y-auto p-2 mt-0">
          {mediaMessages.length > 0 ? (
            <MediaGrid chatId={chat.id} mediaItems={mediaMessages} />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              No media shared in this chat
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="files" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="flex items-center justify-center h-full text-zinc-500">
            No files shared in this chat
          </div>
        </TabsContent>
        
        <TabsContent value="links" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="flex items-center justify-center h-full text-zinc-500">
            No links shared in this chat
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
