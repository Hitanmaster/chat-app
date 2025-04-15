import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Smile, Send, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiPicker } from "./emoji-picker";
import { useChat } from "@/contexts/chat-context";

interface ChatInputProps {
  chatId: number;
  className?: string;
}

export function ChatInput({ chatId, className }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(chatId, message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("p-3 border-t border-zinc-800 bg-zinc-900", className)}>
      <div className="flex items-center space-x-2">
        <Button
          size="icon"
          variant="ghost"
          className="text-zinc-500 h-10 w-10"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <div className="flex-1 bg-zinc-800 rounded-xl flex items-center px-3 py-2">
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-500"
          />

          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-zinc-500 h-8 w-8"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-zinc-700" side="top" align="end">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            variant="ghost"
            className="text-zinc-500 h-8 w-8"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        <Button
          size="icon"
          className="bg-[#E6FF00] text-zinc-900 hover:bg-[#E6FF00]/90 h-10 w-10 rounded-full"
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
