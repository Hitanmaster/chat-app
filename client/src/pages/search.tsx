import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/contexts/chat-context";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "@/components/status-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatWithLastMessage, User } from "@shared/schema";

interface SearchResult {
  type: 'user' | 'chat' | 'message' | 'media';
  id: number;
  title: string;
  subtitle: string;
  avatar?: string;
  userId?: number;
}

export default function Search() {
  const { user } = useAuth();
  const { createChat } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  
  // Fetch chats for the current user (to search through)
  const { data: chats = [] } = useQuery<ChatWithLastMessage[]>({
    queryKey: ['/api/chats', { userId: user?.id }],
    enabled: !!user,
  });
  
  // Fetch all users (to search through)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users/online'],
    enabled: !!user,
  });
  
  // Filter results based on search query
  const filteredResults: SearchResult[] = searchQuery
    ? [
        // Filter users
        ...users
          .filter(u => 
            u.id !== user?.id && 
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(u => ({
            type: 'user' as const,
            id: u.id,
            title: u.username,
            subtitle: u.bio || '',
            avatar: u.avatar || '',
            userId: u.id,
          })),
        
        // Filter chats
        ...chats
          .filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(c => ({
            type: 'chat' as const,
            id: c.id,
            title: c.name,
            subtitle: c.isGroup ? `Group • ${c.members?.length || 0} members` : '',
            avatar: c.avatar || '',
          })),
      ]
    : [];
  
  // Filter based on active tab
  const displayResults = activeTab === 'all' 
    ? filteredResults 
    : filteredResults.filter(result => result.type === activeTab);
  
  // Show suggested contacts when no search query
  const suggestedContacts = users
    .filter(u => u.id !== user?.id)
    .slice(0, 5)
    .map(u => ({
      type: 'user' as const,
      id: u.id,
      title: u.username,
      subtitle: u.bio || '',
      avatar: u.avatar || '',
      userId: u.id,
    }));
  
  const handleSearchClear = () => {
    setSearchQuery("");
  };
  
  const handleAddContact = async (userId: number, username: string) => {
    // Create a new 1-on-1 chat with this user
    try {
      await createChat(username, [userId], false);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };
  
  const handleRemoveRecentSearch = (id: number) => {
    setRecentSearches(prev => prev.filter(search => search.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <StatusBar />
      
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-800">
        <h2 className="font-semibold">Search</h2>
      </div>
      
      {/* Search input */}
      <div className="p-4">
        <div className="bg-zinc-800 rounded-xl flex items-center px-3 py-2 mb-4">
          <SearchIcon className="h-5 w-5 text-zinc-500 mr-2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
            placeholder="Search for people, chats, messages..."
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-500"
              onClick={handleSearchClear}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full rounded-none border-b border-zinc-800 bg-transparent">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
            >
              People
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
            >
              Groups
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E6FF00] data-[state=active]:text-[#E6FF00] data-[state=active]:shadow-none py-3"
            >
              Media
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search results area */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-500 uppercase text-xs font-semibold">
                Recent Searches
              </h3>
              <Button
                variant="link"
                className="text-[#E6FF00] text-sm p-0 h-auto"
                onClick={() => setRecentSearches([])}
              >
                Clear All
              </Button>
            </div>
            
            {recentSearches.map((result) => (
              <div key={`${result.type}-${result.id}`} className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    username={result.title}
                    avatarUrl={result.avatar}
                    userId={result.userId}
                  />
                  <div>
                    <h4 className="font-medium">{result.title}</h4>
                    <p className="text-xs text-zinc-500">{result.subtitle}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500"
                  onClick={() => handleRemoveRecentSearch(result.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Search results or suggested contacts */}
        {searchQuery ? (
          displayResults.length > 0 ? (
            <div className="p-4">
              {displayResults.map((result) => (
                <div key={`${result.type}-${result.id}`} className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      username={result.title}
                      avatarUrl={result.avatar}
                      userId={result.userId}
                      showStatus={result.type === 'user'}
                    />
                    <div>
                      <h4 className="font-medium">{result.title}</h4>
                      <p className="text-xs text-zinc-500">{result.subtitle}</p>
                    </div>
                  </div>
                  {result.type === 'user' && (
                    <Button
                      variant="link"
                      className="text-[#E6FF00] text-sm font-medium"
                      onClick={() => handleAddContact(result.id, result.title)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-500">
              No results found for "{searchQuery}"
            </div>
          )
        ) : (
          <div className="p-4">
            <h3 className="text-zinc-500 uppercase text-xs font-semibold mb-3">
              Suggested Contacts
            </h3>
            
            {suggestedContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    username={contact.title}
                    avatarUrl={contact.avatar}
                    userId={contact.userId}
                    showStatus={true}
                  />
                  <div>
                    <h4 className="font-medium">{contact.title}</h4>
                    <p className="text-xs text-zinc-500">{contact.subtitle || 'User'}</p>
                  </div>
                </div>
                <Button
                  variant="link"
                  className="text-[#E6FF00] text-sm font-medium"
                  onClick={() => handleAddContact(contact.id, contact.title)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
}
