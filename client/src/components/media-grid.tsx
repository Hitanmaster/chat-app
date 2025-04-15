import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface MediaItem {
  id: number;
  url: string;
  type: "image" | "video";
  caption?: string;
}

interface MediaGridProps {
  chatId: number;
  mediaItems: MediaItem[];
  className?: string;
}

export function MediaGrid({ chatId, mediaItems, className }: MediaGridProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {mediaItems.map((item) => (
        <Link href={`/media/${chatId}/view/${item.id}`} key={item.id}>
          <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer">
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={item.caption || "Media"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/50 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
