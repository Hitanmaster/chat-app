import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { StatusBar } from "@/components/status-bar";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";
import { ChatWithMembers } from "@shared/schema";
import { formatDate } from "@/lib/utils";

export default function MediaViewer() {
  const { id, mediaId } = useParams();
  const chatId = parseInt(id);
  const messageId = parseInt(mediaId);
  const { user } = useAuth();
  
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

  // Find the specific message with the media
  const mediaMessage = chat.messages.find(message => message.id === messageId);
  
  if (!mediaMessage || !mediaMessage.mediaUrl) {
    return (
      <div className="flex flex-col h-full bg-black">
        <StatusBar />
        <div className="flex-1 flex items-center justify-center flex-col">
          <p className="text-zinc-500 mb-4">Media not found</p>
          <Link href={`/media/${chatId}`}>
            <Button variant="outline">Back to Media Gallery</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Find the sender of the message
  const sender = chat.members.find(member => member.id === mediaMessage.userId);

  const handleDownload = () => {
    // In a real app, this would download the media
    window.open(mediaMessage.mediaUrl, '_blank');
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    // For now, just copy the URL to clipboard
    navigator.clipboard.writeText(mediaMessage.mediaUrl || '');
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Overlay controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
        <Link href={`/media/${chatId}`}>
          <Button variant="ghost" size="icon" className="text-white h-10 w-10">
            <X className="h-6 w-6" />
          </Button>
        </Link>
        
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white h-10 w-10"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white h-10 w-10"
            onClick={handleShare}
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Media viewer */}
      <div className="flex-1 flex items-center justify-center bg-black">
        {mediaMessage.mediaType === 'image' ? (
          <img 
            src={mediaMessage.mediaUrl} 
            alt="Media preview" 
            className="max-w-full max-h-full"
          />
        ) : mediaMessage.mediaType === 'video' ? (
          <video 
            src={mediaMessage.mediaUrl} 
            controls 
            className="max-w-full max-h-full"
          />
        ) : (
          <div className="text-zinc-500">Unsupported media type</div>
        )}
      </div>
      
      {/* Media info */}
      <div className="p-4 bg-zinc-900">
        <p className="text-zinc-500 text-sm">
          Shared by {sender?.username || 'Unknown'} • {formatDate(mediaMessage.createdAt)}
        </p>
        {mediaMessage.text && (
          <p className="text-sm mt-1">{mediaMessage.text}</p>
        )}
      </div>
    </div>
  );
}
