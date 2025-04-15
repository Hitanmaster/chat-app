import {
  users, type User, type InsertUser,
  chats, type Chat, type InsertChat,
  chatMembers, type ChatMember, type InsertChatMember, 
  messages, type Message, type InsertMessage,
  stories, type Story, type InsertStory,
  storyViews, type StoryView, type InsertStoryView,
  type ChatWithLastMessage, type ChatWithMembers, type UserWithStatus
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastSeen(id: number): Promise<User | undefined>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getChatsForUser(userId: number): Promise<ChatWithLastMessage[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // ChatMember operations
  getChatMembers(chatId: number): Promise<User[]>;
  addChatMember(member: InsertChatMember): Promise<ChatMember>;
  
  // Message operations
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  addReactionToMessage(messageId: number, userId: number, reaction: string): Promise<Message | undefined>;

  // Story operations
  getActiveStories(): Promise<Story[]>;
  getUserStories(userId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  
  // StoryView operations
  viewStory(view: InsertStoryView): Promise<StoryView>;
  
  // Complex operations
  getChatWithDetails(chatId: number): Promise<ChatWithMembers | undefined>;
  getOnlineUsers(): Promise<UserWithStatus[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  private chatMembers: Map<number, ChatMember[]>;
  private messages: Map<number, Message[]>;
  private stories: Map<number, Story[]>;
  private storyViews: Map<number, StoryView[]>;
  private userIdCounter: number;
  private chatIdCounter: number;
  private messageIdCounter: number;
  private storyIdCounter: number;
  private chatMemberIdCounter: number;
  private storyViewIdCounter: number;
  private onlineUsers: Set<number>;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.chatMembers = new Map();
    this.messages = new Map();
    this.stories = new Map();
    this.storyViews = new Map();
    this.userIdCounter = 1;
    this.chatIdCounter = 1;
    this.messageIdCounter = 1;
    this.storyIdCounter = 1;
    this.chatMemberIdCounter = 1;
    this.storyViewIdCounter = 1;
    this.onlineUsers = new Set();

    // Add some default users
    this.seedData();
  }

  private seedData() {
    // Create some initial users
    const john = this.createUser({ username: "John", avatar: "JD", bio: "UI/UX Designer", guest: false });
    const alex = this.createUser({ username: "Alex", avatar: "", bio: "Group Admin", guest: false });
    const mia = this.createUser({ username: "Mia", avatar: "", bio: "UX Designer", guest: false });
    const jack = this.createUser({ username: "Jack", avatar: "", bio: "Product Manager", guest: false });
    
    // Create design team group chat
    const designTeam = this.createChat({ 
      name: "Design Team", 
      avatar: "", 
      isGroup: true, 
      createdBy: alex.id 
    });
    
    // Add members to design team
    this.addChatMember({ chatId: designTeam.id, userId: alex.id, isAdmin: true });
    this.addChatMember({ chatId: designTeam.id, userId: mia.id, isAdmin: false });
    this.addChatMember({ chatId: designTeam.id, userId: jack.id, isAdmin: false });
    this.addChatMember({ chatId: designTeam.id, userId: john.id, isAdmin: false });
    
    // Add some messages to design team
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
    
    this.createMessage({
      chatId: designTeam.id,
      userId: alex.id,
      text: "Hey team, check out the new mockups I sent for the homepage redesign"
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: alex.id,
      text: "Homepage redesign v2",
      mediaUrl: "https://images.unsplash.com/photo-1481487196290-c152efe083f5",
      mediaType: "image"
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: mia.id,
      text: "Looks good! I like the new navigation bar."
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: john.id,
      text: "I agree. The color scheme works better with our brand guidelines now."
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: john.id,
      text: "When do we need to finalize this?"
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: jack.id,
      text: "The client wants to see it by Friday. I think we're in good shape though."
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: mia.id,
      text: "Let's have a quick call tomorrow morning to discuss any final changes?"
    });
    
    this.createMessage({
      chatId: designTeam.id,
      userId: john.id,
      text: "Sounds good to me! 9:30AM?"
    });
    
    // Create 1-on-1 chats
    const miaChatWithJohn = this.createChat({
      name: "Mia Chen",
      avatar: "",
      isGroup: false,
      createdBy: mia.id
    });
    
    this.addChatMember({ chatId: miaChatWithJohn.id, userId: mia.id, isAdmin: false });
    this.addChatMember({ chatId: miaChatWithJohn.id, userId: john.id, isAdmin: false });
    
    this.createMessage({
      chatId: miaChatWithJohn.id,
      userId: mia.id,
      text: "Are we still meeting tomorrow?"
    });
    
    const jackChatWithJohn = this.createChat({
      name: "Jack Wilson",
      avatar: "",
      isGroup: false,
      createdBy: jack.id
    });
    
    this.addChatMember({ chatId: jackChatWithJohn.id, userId: jack.id, isAdmin: false });
    this.addChatMember({ chatId: jackChatWithJohn.id, userId: john.id, isAdmin: false });
    
    this.createMessage({
      chatId: jackChatWithJohn.id,
      userId: jack.id,
      text: "I'll send you the files later today"
    });
    
    // Create stories
    const dayInMs = 24 * 60 * 60 * 1000;
    
    this.createStory({
      userId: mia.id,
      mediaUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      mediaType: "image",
      caption: "Working on a new design",
      expiresAt: new Date(now.getTime() + dayInMs)
    });
    
    this.createStory({
      userId: alex.id,
      mediaUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
      mediaType: "image",
      caption: "Office vibes",
      expiresAt: new Date(now.getTime() - (2 * dayInMs)) // Already expired
    });
    
    this.createStory({
      userId: jack.id,
      mediaUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61",
      mediaType: "image",
      caption: "Coffee break",
      expiresAt: new Date(now.getTime() + dayInMs)
    });

    // Set Alex and Mia as online
    this.onlineUsers.add(alex.id);
    this.onlineUsers.add(mia.id);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      lastSeen: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLastSeen(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      lastSeen: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getChatsForUser(userId: number): Promise<ChatWithLastMessage[]> {
    const userChats: ChatWithLastMessage[] = [];
    
    // Find all chatMembers for this user
    for (const [chatId, members] of this.chatMembers.entries()) {
      if (members.some(member => member.userId === userId)) {
        const chat = this.chats.get(chatId);
        if (chat) {
          const chatMessages = this.messages.get(chatId) || [];
          const sortedMessages = [...chatMessages].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : undefined;
          const unreadCount = 0; // Would need to track this with actual read receipts
          
          userChats.push({
            ...chat,
            lastMessage,
            unreadCount
          });
        }
      }
    }
    
    // Sort by latest message
    return userChats.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.chatIdCounter++;
    const now = new Date();
    const chat: Chat = {
      ...insertChat,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.chats.set(id, chat);
    return chat;
  }

  // ChatMember operations
  async getChatMembers(chatId: number): Promise<User[]> {
    const members = this.chatMembers.get(chatId) || [];
    return Promise.all(
      members.map(async member => {
        const user = await this.getUser(member.userId);
        return user!;
      })
    );
  }

  async addChatMember(insertMember: InsertChatMember): Promise<ChatMember> {
    const id = this.chatMemberIdCounter++;
    const member: ChatMember = {
      ...insertMember,
      id,
      joinedAt: new Date()
    };
    
    const existingMembers = this.chatMembers.get(insertMember.chatId) || [];
    this.chatMembers.set(insertMember.chatId, [...existingMembers, member]);
    
    return member;
  }

  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    const messages = this.messages.get(chatId) || [];
    return [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...insertMessage,
      id,
      reactions: {},
      createdAt: new Date()
    };
    
    const existingMessages = this.messages.get(insertMessage.chatId) || [];
    this.messages.set(insertMessage.chatId, [...existingMessages, message]);
    
    // Update chat's updatedAt
    const chat = await this.getChat(insertMessage.chatId);
    if (chat) {
      const updatedChat = {
        ...chat,
        updatedAt: new Date()
      };
      this.chats.set(chat.id, updatedChat);
    }
    
    return message;
  }

  async addReactionToMessage(messageId: number, userId: number, reaction: string): Promise<Message | undefined> {
    // Find the message
    for (const [chatId, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        const message = messages[messageIndex];
        const reactions = message.reactions || {};
        
        // Update reaction count
        reactions[reaction] = (reactions[reaction] || 0) + 1;
        
        // Create updated message
        const updatedMessage = {
          ...message,
          reactions
        };
        
        // Replace message in array
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = updatedMessage;
        this.messages.set(chatId, updatedMessages);
        
        return updatedMessage;
      }
    }
    
    return undefined;
  }

  // Story operations
  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    const activeStories: Story[] = [];
    
    for (const stories of this.stories.values()) {
      for (const story of stories) {
        if (new Date(story.expiresAt) > now) {
          activeStories.push(story);
        }
      }
    }
    
    return activeStories;
  }

  async getUserStories(userId: number): Promise<Story[]> {
    const userStories = this.stories.get(userId) || [];
    const now = new Date();
    
    return userStories.filter(story => new Date(story.expiresAt) > now)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyIdCounter++;
    const story: Story = {
      ...insertStory,
      id,
      createdAt: new Date()
    };
    
    const userStories = this.stories.get(insertStory.userId) || [];
    this.stories.set(insertStory.userId, [...userStories, story]);
    
    return story;
  }

  // StoryView operations
  async viewStory(insertView: InsertStoryView): Promise<StoryView> {
    const id = this.storyViewIdCounter++;
    const view: StoryView = {
      ...insertView,
      id,
      viewedAt: new Date()
    };
    
    const storyViews = this.storyViews.get(insertView.storyId) || [];
    this.storyViews.set(insertView.storyId, [...storyViews, view]);
    
    return view;
  }

  // Complex operations
  async getChatWithDetails(chatId: number): Promise<ChatWithMembers | undefined> {
    const chat = await this.getChat(chatId);
    if (!chat) return undefined;
    
    const members = await this.getChatMembers(chatId);
    const messages = await this.getMessages(chatId);
    
    return {
      ...chat,
      members,
      messages
    };
  }

  async getOnlineUsers(): Promise<UserWithStatus[]> {
    const result: UserWithStatus[] = [];
    
    for (const user of this.users.values()) {
      result.push({
        ...user,
        status: this.onlineUsers.has(user.id) ? 'online' : 'offline'
      });
    }
    
    return result;
  }
}

export const storage = new MemStorage();
