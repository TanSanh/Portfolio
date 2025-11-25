"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Message {
  _id?: string;
  text: string;
  sender: "user" | "admin";
  createdAt?: Date;
  conversationId: string;
  fullName?: string;
  phone?: string;
  email?: string;
  isRead?: boolean;
}

interface Conversation {
  conversationId: string;
  lastMessage: Message;
  messageCount: number;
  unreadCount: number;
  fullName?: string;
  phone?: string;
  email?: string;
}

export default function AdminChatPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  // WebSocket không dùng /api prefix
  const socketUrl = apiUrl.replace("/api", "");

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Khởi tạo Socket
  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      auth: {
        token: token,
      },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("new_message", (message: Message) => {
      if (message.conversationId === selectedConversation) {
        setMessages((prev) => [...prev, message]);
      }
      // Cập nhật danh sách conversations
      fetchConversations();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, apiUrl]);

  // Join conversation khi chọn
  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit("join_conversation", {
        conversationId: selectedConversation,
      });
      fetchMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${apiUrl}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      // Lỗi khi tải conversations
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/chat/messages/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      // Lỗi khi tải messages
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`${apiUrl}/chat/mark-read/${conversationId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchConversations();
    } catch (error) {
      // Lỗi khi đánh dấu đã đọc
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !selectedConversation) return;

    const messageData = {
      conversationId: selectedConversation,
      sender: "admin" as const,
      text: inputMessage,
    };

    socket.emit("send_message", messageData);
    setInputMessage("");
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Refresh mỗi 5 giây
    return () => clearInterval(interval);
  }, []);

  const selectedConvData = conversations.find(
    (c) => c.conversationId === selectedConversation
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-dark text-text-dark-primary p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Quản Lý Chat</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Danh sách Conversations */}
            <div className="bg-background-dark-secondary rounded-lg border border-white/10 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cuộc trò chuyện</h2>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </div>

              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-text-dark-secondary text-center py-8">
                    Chưa có cuộc trò chuyện nào
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() =>
                        setSelectedConversation(conv.conversationId)
                      }
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedConversation === conv.conversationId
                          ? "bg-primary/20 border-primary"
                          : "bg-background-dark border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {conv.fullName || "Khách"}
                          </p>
                          <p className="text-sm text-text-dark-secondary truncate">
                            {conv.lastMessage?.text || "Chưa có tin nhắn"}
                          </p>
                          {conv.phone && (
                            <p className="text-xs text-text-dark-secondary">
                              {conv.phone}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-background-dark-secondary rounded-lg border border-white/10 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedConvData?.fullName || "Khách"}
                        </h3>
                        {selectedConvData?.email && (
                          <p className="text-sm text-text-dark-secondary">
                            {selectedConvData.email}
                          </p>
                        )}
                        {selectedConvData?.phone && (
                          <p className="text-sm text-text-dark-secondary">
                            {selectedConvData.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id || message.createdAt?.toString()}
                        className={`flex ${
                          message.sender === "admin"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.sender === "admin"
                              ? "bg-primary text-white"
                              : "bg-background-dark text-text-dark-primary border border-white/10"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "admin"
                                ? "text-white/70"
                                : "text-text-dark-secondary"
                            }`}
                          >
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-white/10"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-2 bg-background-dark border border-white/10 rounded-lg text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={!isConnected}
                      />
                      <button
                        type="submit"
                        disabled={!isConnected || !inputMessage.trim()}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Gửi
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-text-dark-secondary">
                  Chọn một cuộc trò chuyện để bắt đầu
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
