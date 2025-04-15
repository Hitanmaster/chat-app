import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertChatSchema,
  insertChatMemberSchema,
  insertMessageSchema,
  insertStorySchema,
  type WebSocketMessage
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Map to keep track of connected clients
  const clients = new Map<number, WebSocket>();
  
  console.log('WebSocket server initialized on path: /ws');
  
  wss.on('connection', (ws, req) => {
    console.log(`New WebSocket connection established from ${req.socket.remoteAddress}`);
    let userId: number | null = null;
    let pingInterval: NodeJS.Timeout | null = null;
    
    // Send immediate connection confirmation
    try {
      ws.send(JSON.stringify({
        type: 'connection_established',
        payload: { timestamp: new Date().toISOString() }
      }));
    } catch (err) {
      console.error('Error sending connection confirmation:', err);
    }
    
    // Set up a ping interval to keep the connection alive
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (err) {
          console.error('Error sending ping:', err);
          clearInterval(pingInterval!);
        }
      } else {
        clearInterval(pingInterval!);
      }
    }, 30000); // Every 30 seconds
    
    ws.on('message', async (data) => {
      try {
        const dataStr = data.toString();
        console.log('WebSocket message received:', dataStr);
        
        let message: WebSocketMessage;
        try {
          message = JSON.parse(dataStr) as WebSocketMessage;
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Invalid message format' }
          }));
          return;
        }
        
        switch (message.type) {
          case 'auth':
            // Authenticate user
            try {
              userId = message.payload.userId;
              console.log(`User authentication attempt, userId: ${userId}`);
              
              if (!userId || typeof userId !== 'number') {
                console.error('Invalid user ID in auth message');
                ws.send(JSON.stringify({
                  type: 'auth_error',
                  payload: { message: 'Invalid user ID' }
                }));
                return;
              }
              
              // Check if user exists
              const user = await storage.getUser(userId);
              if (!user) {
                console.error(`User not found: ${userId}`);
                ws.send(JSON.stringify({
                  type: 'auth_error',
                  payload: { message: 'User not found' }
                }));
                return;
              }
              
              // Register this connection
              clients.set(userId, ws);
              await storage.updateUserLastSeen(userId);
              
              console.log(`User authenticated successfully, userId: ${userId}`);
              
              // Send confirmation to the client
              ws.send(JSON.stringify({
                type: 'auth_confirmed',
                payload: { 
                  userId,
                  timestamp: new Date().toISOString(),
                  user: user
                }
              }));
              
              // Notify other clients that this user is online
              broadcastUserStatus(userId, 'online');
            } catch (error) {
              console.error('Error during authentication:', error);
              ws.send(JSON.stringify({
                type: 'auth_error',
                payload: { message: 'Authentication failed' }
              }));
            }
            break;
            
          case 'ping':
            // Client ping, respond with pong
            ws.send(JSON.stringify({
              type: 'pong',
              payload: { timestamp: new Date().toISOString() }
            }));
            break;
            
          case 'message':
            if (!userId) {
              console.log('Message received without authenticated user');
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Authentication required' }
              }));
              break;
            }
            
            try {
              // Validate and create message
              const { chatId, text, mediaUrl, mediaType } = message.payload;
              console.log(`Message received from user ${userId} for chat ${chatId}: ${text}`);
              
              const validatedMessage = await insertMessageSchema.parseAsync({
                chatId,
                userId,
                text,
                mediaUrl,
                mediaType
              });
              
              const newMessage = await storage.createMessage(validatedMessage);
              console.log(`Created new message with ID: ${newMessage.id}`);
              
              // Send confirmation to sender
              ws.send(JSON.stringify({
                type: 'message_sent',
                payload: {
                  messageId: newMessage.id,
                  timestamp: new Date().toISOString()
                }
              }));
              
              // Broadcast to all members of the chat
              broadcastToChatMembers(chatId, {
                type: 'new_message',
                payload: {
                  chatId,
                  message: newMessage
                }
              });
            } catch (error) {
              console.error('Error processing message:', error);
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Failed to process message' }
              }));
            }
            break;
            
          case 'reaction':
            if (!userId) {
              console.log('Reaction received without authenticated user');
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Authentication required' }
              }));
              break;
            }
            
            try {
              const { messageId, reaction } = message.payload;
              console.log(`Reaction received from user ${userId} for message ${messageId}: ${reaction}`);
              
              if (!messageId || !reaction) {
                ws.send(JSON.stringify({
                  type: 'error',
                  payload: { message: 'Invalid reaction data' }
                }));
                return;
              }
              
              const updatedMessage = await storage.addReactionToMessage(messageId, userId, reaction);
              
              if (updatedMessage) {
                // Send confirmation to sender
                ws.send(JSON.stringify({
                  type: 'reaction_added',
                  payload: {
                    messageId,
                    reaction,
                    timestamp: new Date().toISOString()
                  }
                }));
                
                // Broadcast to chat members
                broadcastToChatMembers(updatedMessage.chatId, {
                  type: 'message_reaction',
                  payload: {
                    messageId,
                    userId,
                    reaction,
                    updatedReactions: updatedMessage.reactions
                  }
                });
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  payload: { message: 'Message not found or reaction failed' }
                }));
              }
            } catch (error) {
              console.error('Error processing reaction:', error);
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Failed to process reaction' }
              }));
            }
            break;
            
          default:
            console.log(`Unknown message type: ${message.type}`);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: `Unknown message type: ${message.type}` }
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        try {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Server error processing message' }
          }));
        } catch (sendError) {
          console.error('Error sending error response:', sendError);
        }
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: code=${code}, reason=${reason || 'none'}`);
      
      // Clean up
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      
      if (userId) {
        clients.delete(userId);
        storage.updateUserLastSeen(userId)
          .then(() => {
            // Notify other clients that this user is offline
            broadcastUserStatus(userId!, 'offline');
          })
          .catch(err => {
            console.error(`Error updating last seen for user ${userId}:`, err);
          });
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    });
    
    // Handle pong responses (keep-alive)
    ws.on('pong', () => {
      // Connection is still alive
      if (userId) {
        storage.updateUserLastSeen(userId).catch(err => {
          console.error(`Error updating last seen for user ${userId}:`, err);
        });
      }
    });
  });
  
  // Helper function to broadcast to chat members
  async function broadcastToChatMembers(chatId: number, message: WebSocketMessage) {
    const members = await storage.getChatMembers(chatId);
    
    for (const member of members) {
      const client = clients.get(member.id);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }
  
  // Helper function to broadcast user status
  function broadcastUserStatus(userId: number, status: 'online' | 'offline') {
    const statusMessage: WebSocketMessage = {
      type: 'user_status',
      payload: {
        userId,
        status
      }
    };
    
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(statusMessage));
      }
    }
  }

  // API routes
  // Users
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const userData = await insertUserSchema.parseAsync(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user data' });
    }
  });
  
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
  
  // Chats
  app.get('/api/chats', async (req: Request, res: Response) => {
    const userIdStr = req.query.userId as string;
    if (!userIdStr) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }
    
    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const chats = await storage.getChatsForUser(userId);
    res.json(chats);
  });
  
  app.post('/api/chats', async (req: Request, res: Response) => {
    try {
      const chatData = await insertChatSchema.parseAsync(req.body);
      const chat = await storage.createChat(chatData);
      
      // If members are provided, add them to the chat
      if (req.body.members && Array.isArray(req.body.members)) {
        for (const memberId of req.body.members) {
          await storage.addChatMember({
            chatId: chat.id,
            userId: memberId,
            isAdmin: memberId === chatData.createdBy
          });
        }
      }
      
      res.status(201).json(chat);
    } catch (error) {
      res.status(400).json({ error: 'Invalid chat data' });
    }
  });
  
  app.get('/api/chats/:id', async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.id);
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    const chat = await storage.getChatWithDetails(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    res.json(chat);
  });
  
  app.post('/api/chats/:id/members', async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.id);
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    try {
      const memberData = await insertChatMemberSchema.parseAsync({
        ...req.body,
        chatId
      });
      
      const member = await storage.addChatMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: 'Invalid member data' });
    }
  });
  
  // Messages
  app.get('/api/chats/:id/messages', async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.id);
    if (isNaN(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    const messages = await storage.getMessages(chatId);
    res.json(messages);
  });
  
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const messageData = await insertMessageSchema.parseAsync(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: 'Invalid message data' });
    }
  });
  
  // Stories
  app.get('/api/stories', async (req: Request, res: Response) => {
    const userIdStr = req.query.userId as string;
    
    if (userIdStr) {
      const userId = parseInt(userIdStr);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const stories = await storage.getUserStories(userId);
      return res.json(stories);
    }
    
    // If no userId, return all active stories
    const stories = await storage.getActiveStories();
    res.json(stories);
  });
  
  app.post('/api/stories', async (req: Request, res: Response) => {
    try {
      const storyData = await insertStorySchema.parseAsync(req.body);
      const story = await storage.createStory(storyData);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ error: 'Invalid story data' });
    }
  });
  
  // Online users
  app.get('/api/users/online', async (req: Request, res: Response) => {
    const users = await storage.getOnlineUsers();
    res.json(users);
  });

  return httpServer;
}
