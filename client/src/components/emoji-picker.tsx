import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMOJI_CATEGORIES = {
  recent: ["👍", "❤️", "😊", "👋", "🙌", "🎉", "👏", "🔥"],
  smileys: ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘"],
  people: ["👶", "👦", "👧", "👨", "👩", "👴", "👵", "👨‍⚕️", "👩‍⚕️", "👨‍🎓", "👩‍🎓", "👨‍🏫", "👩‍🏫"],
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸"],
  food: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍"],
  activities: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅", "🏒", "🏑", "🥍"],
  objects: ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀"],
  symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "❣️", "💕", "💞", "💓", "💗", "💖", "💘"],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState("recent");

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <Tabs
      defaultValue="recent"
      value={activeTab}
      onValueChange={setActiveTab}
      className={className}
    >
      <div className="p-4 bg-zinc-900 border-b border-zinc-800">
        <TabsList className="grid grid-cols-8 bg-zinc-800">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="text-xs py-1 data-[state=active]:bg-[#E6FF00] data-[state=active]:text-zinc-900"
            >
              {category === "recent" ? "🕒" : EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES][0]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="p-4 h-60 overflow-y-auto bg-zinc-900">
        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
          <TabsContent key={category} value={category} className="m-0">
            <div className="grid grid-cols-8 gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-zinc-800 p-2 rounded cursor-pointer transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
