"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Message {
  _id?: string;
  id?: string;
  text: string;
  sender: "user" | "admin";
  timestamp?: Date;
  createdAt?: Date;
  conversationId?: string;
  isRead?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const emitTypingStatus = (isTyping: boolean) => {
    if (!conversationIdRef.current || !socket) return;
    socket.emit("typing", {
      conversationId: conversationIdRef.current,
      sender: "user",
      isTyping,
    });
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitTypingStatus(false);
  };

  const scheduleTypingStatus = () => {
    if (!conversationIdRef.current || !socket) return;
    emitTypingStatus(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Khởi tạo Socket connection
  useEffect(() => {
    // WebSocket không dùng /api prefix
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socketUrl = apiUrl.replace("/api", ""); // Bỏ /api cho WebSocket

    // Chỉ kết nối khi widget mở hoặc đã bắt đầu chat
    if (!isOpen && !isStarted) return;

    const newSocket = io(socketUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
    });

    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => {
        const messageId = message._id || message.id;
        const existingIndex = prev.findIndex(
          (msg) => msg._id === messageId || msg.id === messageId
        );

        const formattedMessage = {
          ...message,
          id: messageId || `msg-${Date.now()}-${Math.random()}`,
          _id: message._id,
          timestamp: message.createdAt
            ? new Date(message.createdAt)
            : message.timestamp || new Date(),
          isRead: message.isRead,
        };

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = formattedMessage;
          return updated;
        }

        return [...prev, formattedMessage];
      });
    });

    newSocket.on("messages", (messagesList: Message[]) => {
      const uniqueMessages = new Map<string, Message>();

      messagesList.forEach((msg, index) => {
        const id = msg._id || msg.id || `msg-${index}-${Date.now()}`;
        if (!uniqueMessages.has(id)) {
          uniqueMessages.set(id, {
            ...msg,
            id,
            _id: msg._id,
            timestamp: msg.createdAt
              ? new Date(msg.createdAt)
              : msg.timestamp || new Date(),
            isRead: msg.isRead,
          });
        }
      });

      setMessages(Array.from(uniqueMessages.values()));
    });

    setSocket(newSocket);

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [isOpen, isStarted]);

  useEffect(() => {
    if (!socket) return;
    const handleMessagesRead = (conversationId: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === conversationId && msg.sender === "user"
            ? { ...msg, isRead: true }
            : msg
        )
      );
    };
    const handleTypingStatus = (data: {
      conversationId: string;
      sender: "user" | "admin";
      isTyping: boolean;
    }) => {
      if (
        data.sender === "admin" &&
        data.conversationId === conversationIdRef.current
      ) {
        setIsAdminTyping(data.isTyping);
      }
    };
    socket.on("messages_read", handleMessagesRead);
    socket.on("typing_status", handleTypingStatus);
    return () => {
      socket.off("messages_read", handleMessagesRead);
      socket.off("typing_status", handleTypingStatus);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, []);

  // Join conversation khi có conversationId
  useEffect(() => {
    if (socket && conversationId && isStarted && isConnected) {
      socket.emit("join_conversation", { conversationId });
    }
  }, [socket, conversationId, isStarted, isConnected]);

  // Focus input khi mở chat
  useEffect(() => {
    if (isOpen && isStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isStarted]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/chat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Không thể bắt đầu chat");
      }

      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages(data.messages || []);
      setIsStarted(true);
      toast.success("Bắt đầu chat thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) {
      toast.error("Vui lòng nhập tin nhắn");
      return;
    }
    if (!socket) {
      toast.error("Chưa kết nối đến server. Vui lòng thử lại.");
      return;
    }
    if (!conversationId) {
      toast.error("Chưa bắt đầu cuộc trò chuyện.");
      return;
    }
    if (!isConnected) {
      toast.error("Đang kết nối... Vui lòng đợi.");
      return;
    }

    const messageText = inputMessage.trim();
    const messageData = {
      conversationId,
      sender: "user" as const,
      text: messageText,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
    };

    // Optimistic update - hiển thị message ngay lập tức
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
      conversationId,
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage("");
    stopTyping();

    // Gửi message qua socket
    socket.emit("send_message", messageData, (response: any) => {
      if (response && response.error) {
        // Nếu có lỗi, xóa message tạm và hiển thị lỗi
        setMessages((prev) =>
          prev.filter(
            (msg) => msg.id !== tempMessage.id && !msg.id?.startsWith("temp-")
          )
        );
        toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
      } else if (response && response.success) {
        const responseId = response._id || response.id;
        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) =>
              msg.id !== tempMessage.id &&
              msg._id !== responseId &&
              msg.id !== responseId
          );
          return [
            ...filtered,
            {
              ...response,
              _id: response._id,
              id: responseId || `msg-${Date.now()}`,
              timestamp: response.createdAt
                ? new Date(response.createdAt)
                : new Date(),
              isRead: response.isRead,
            },
          ];
        });
      }
    });

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    setIsStarted(false);
    setMessages([]);
    setConversationId(null);
    setFormData({ fullName: "", phone: "", email: "" });
    stopTyping();
    if (socket && conversationId) {
      socket.emit("leave_conversation", { conversationId });
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    if (!value.trim()) {
      stopTyping();
      return;
    }
    scheduleTypingStatus();
  };

  const formatMessage = (message: Message, index?: number): Message => {
    // Đảm bảo mỗi message có id unique
    const uniqueId =
      message._id ||
      message.id ||
      `msg-${Date.now()}-${index || Math.random()}`;
    return {
      id: uniqueId,
      _id: message._id,
      text: message.text,
      sender: message.sender,
      timestamp: message.createdAt
        ? new Date(message.createdAt)
        : message.timestamp || new Date(),
      conversationId: message.conversationId,
      isRead: message.isRead,
    };
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Mở chat"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          {isConnected && (
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </motion.button>
      )}

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-background-dark-secondary rounded-lg shadow-2xl overflow-hidden flex flex-col border border-white/10"
            style={{ maxHeight: "600px", height: "600px" }}
          >
            {/* Header */}
            <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <span className="font-semibold">Hỗ trợ trực tuyến</span>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Đóng chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col bg-background-dark">
              {!isStarted ? (
                /* Form Start Chat */
                <div className="flex-1 p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-text-dark-primary text-center mb-2">
                    Chào mừng bạn!
                  </h3>
                  <p className="text-sm text-text-dark-secondary text-center mb-6">
                    Vui lòng cung cấp thông tin để bắt đầu
                  </p>

                  <form onSubmit={handleStartChat} className="space-y-4">
                    {/* Họ và tên */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-dark-primary mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full px-4 py-2 bg-background-dark-secondary border border-white/10 rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-dark-primary mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="VD: 0931 000 000"
                        className="w-full px-4 py-2 bg-background-dark-secondary border border-white/10 rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-dark-primary mb-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="email@domain.com"
                        className="w-full px-4 py-2 bg-background-dark-secondary border border-white/10 rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Bắt đầu chat
                    </button>
                  </form>
                </div>
              ) : (
                /* Chat Messages */
                <>
                  <div
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 custom-scrollbar"
                    data-lenis-prevent
                  >
                    {messages.map((message, index) => {
                      const formatted = formatMessage(message, index);
                      // Đảm bảo key unique: ưu tiên _id, sau đó id, cuối cùng là index
                      const uniqueKey =
                        formatted._id ||
                        formatted.id ||
                        `msg-${index}-${formatted.timestamp?.getTime()}`;
                      return (
                        <div
                          key={uniqueKey}
                          className={`flex ${
                            formatted.sender === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              formatted.sender === "user"
                                ? "bg-primary text-white"
                                : "bg-background-dark-secondary text-text-dark-primary border border-white/10"
                            }`}
                          >
                            <p className="text-sm break-words whitespace-pre-wrap">
                              {formatted.text}
                            </p>
                            <div
                              className={`flex items-center gap-2 mt-1 ${
                                formatted.sender === "user"
                                  ? "justify-between"
                                  : "justify-start"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  formatted.sender === "user"
                                    ? "text-white/70"
                                    : "text-text-dark-secondary"
                                }`}
                              >
                                {formatted.timestamp?.toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                ) ||
                                  new Date().toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </p>
                              {formatted.sender === "user" &&
                                formatted.isRead && (
                                  <span className="text-[10px] uppercase tracking-wide text-white/90">
                                    Đã xem
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  {isAdminTyping && (
                    <div className="px-4 pb-1 text-[11px] text-text-dark-secondary">
                      Đang soạn tin...
                    </div>
                  )}
                  <form
                    onSubmit={handleSendMessage}
                    className="border-t border-white/10 p-4 bg-background-dark-secondary relative"
                  >
                    <div className="flex gap-2 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-2 bg-background-dark border border-white/10 rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Gửi tin nhắn"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
