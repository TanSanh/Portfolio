"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import Image from "next/image";

interface Message {
  _id?: string;
  id?: string;
  text: string;
  sender: "user" | "admin";
  createdAt?: Date;
  conversationId: string;
  fullName?: string;
  phone?: string;
  email?: string;
  isRead?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedConversationRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    previewUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const socketUrl = apiUrl.replace("/api", "");

  const getExtension = (value?: string) => {
    if (!value) return "";
    const sanitized = value.split("?")[0];
    const parts = sanitized.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
  };

  const openFileInNewTab = (fileUrl?: string, fileName?: string) => {
    if (!fileUrl) return;
    const extension =
      getExtension(fileName) || getExtension(fileUrl.split("/").pop());
    const officeFormats = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];
    let targetUrl = fileUrl;

    if (extension && officeFormats.includes(extension)) {
      const absoluteUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${window.location.origin}${
            fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`
          }`;
      targetUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
        absoluteUrl
      )}`;
    }

    window.open(targetUrl, "_blank");
  };

  const isImageFile = (fileType?: string, fileUrl?: string) => {
    if (!fileType && !fileUrl) return false;
    if (fileType?.startsWith("image")) return true;
    const extension = getExtension(fileUrl);
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "heic",
    ];
    return extension ? imageExtensions.includes(extension) : false;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchConversations = useCallback(async () => {
    if (!token) return;
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
  }, [token, apiUrl]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!token) return;
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
          setMessages(
            data.map((msg: Message) => ({
              ...msg,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
            }))
          );
        }
      } catch (error) {
        // Lỗi khi tải messages
      }
    },
    [token, apiUrl]
  );

  const markAsRead = useCallback((conversationId: string) => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return;
    setConversations((prev) =>
      prev.map((conv) =>
        conv.conversationId === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    currentSocket.emit("mark_read", { conversationId });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const emitTypingStatus = useCallback(
    (isTyping: boolean, conversationId?: string) => {
      const activeConversation =
        conversationId || selectedConversationRef.current;
      if (!activeConversation) return;
      socketRef.current?.emit("typing", {
        conversationId: activeConversation,
        sender: "admin",
        isTyping,
      });
    },
    []
  );

  const scheduleTypingStatus = useCallback(() => {
    if (!selectedConversationRef.current) return;
    emitTypingStatus(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus(false);
      typingTimeoutRef.current = null;
    }, 2000);
  }, [emitTypingStatus]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitTypingStatus(false);
  }, [emitTypingStatus]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File không được vượt quá 20MB");
      return;
    }

    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedFile({
      file,
      previewUrl,
      fileName: file.name,
      fileType: file.type?.startsWith("image") ? "image" : "file",
      fileSize: file.size,
    });
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile?.file) return null;
    setUploadingFile(true);
    try {
      const baseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
      const formData = new FormData();
      formData.append("file", selectedFile.file);

      const response = await fetch(`${baseUrl}/chat/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể upload file");
      }

      const data = await response.json();
      const fileUrl = data.url.startsWith("/api/")
        ? `${apiUrl.replace("/api", "")}${data.url}`
        : `${baseUrl.replace("/api", "")}${data.url}`;

      return {
        fileUrl,
        fileName: data.originalName,
        fileType: data.fileType,
        fileSize: data.fileSize,
      };
    } finally {
      setUploadingFile(false);
    }
  };

  // Khởi tạo Socket
  useEffect(() => {
    if (!token) return;

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
      const normalizedMessage = {
        ...message,
        createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
      };
      const messageId = message._id || (message as any).id;
      const isActiveConversation =
        selectedConversationRef.current === message.conversationId;

      if (isActiveConversation) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id === messageId ||
              (messageId && msg.id === messageId) ||
              msg.createdAt?.toString() ===
                normalizedMessage.createdAt?.toString()
          );
          if (exists) {
            return prev;
          }
          return [...prev, normalizedMessage];
        });
        if (message.sender === "user") {
          markAsRead(message.conversationId);
        }
      }

      setConversations((prev) => {
        const existingConversation = prev.find(
          (conv) => conv.conversationId === message.conversationId
        );

        if (!existingConversation) {
          return [
            {
              conversationId: message.conversationId,
              lastMessage: normalizedMessage,
              messageCount: 1,
              unreadCount:
                !isActiveConversation && message.sender === "user" ? 1 : 0,
              fullName: message.fullName,
              phone: message.phone,
              email: message.email,
            },
            ...prev,
          ];
        }

        return prev.map((conv) =>
          conv.conversationId === message.conversationId
            ? {
                ...conv,
                lastMessage: normalizedMessage,
                messageCount: conv.messageCount + 1,
                unreadCount:
                  isActiveConversation || message.sender === "admin"
                    ? 0
                    : conv.unreadCount + 1,
              }
            : conv
        );
      });

      fetchConversations();
    });

    newSocket.on("messages", (messagesList: Message[]) => {
      setMessages(
        messagesList.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        }))
      );
    });

    const handleTypingStatus = (data: {
      conversationId: string;
      sender: "user" | "admin";
      isTyping: boolean;
    }) => {
      if (data.sender !== "user") return;
      setTypingStatus((prev) => ({
        ...prev,
        [data.conversationId]: data.isTyping,
      }));
    };
    newSocket.on("typing_status", handleTypingStatus);

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.off("typing_status", handleTypingStatus);
      socketRef.current = null;
      newSocket.close();
    };
  }, [token, apiUrl, socketUrl, fetchConversations, markAsRead]);

  // Join conversation khi chọn
  useEffect(() => {
    const currentSocket = socketRef.current;
    if (currentSocket && selectedConversation) {
      currentSocket.emit("join_conversation", {
        conversationId: selectedConversation,
      });
      fetchMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
    setIsMenuOpen(false);
    setShowInfoModal(false);
  }, [socket, selectedConversation, fetchMessages, markAsRead]);

  useEffect(() => {
    return () => {
      if (selectedConversation) {
        emitTypingStatus(false, selectedConversation);
      }
    };
  }, [selectedConversation, emitTypingStatus]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  const handleSelectConversation = (conversationId: string) => {
    stopTyping();
    setSelectedConversation(conversationId);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.conversationId === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    setTypingStatus((prev) => ({
      ...prev,
      [conversationId]: false,
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentSocket = socketRef.current;
    if (!currentSocket || !selectedConversation) return;

    const messageText = inputMessage.trim();
    if (!messageText && !selectedFile) {
      toast.error("Vui lòng nhập tin nhắn hoặc chọn file");
      return;
    }

    const messageData: Record<string, any> = {
      conversationId: selectedConversation,
      sender: "admin" as const,
    };

    if (messageText) {
      messageData.text = messageText;
    }

    let uploadedFileData: {
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    } | null = null;

    if (selectedFile) {
      try {
        uploadedFileData = await uploadSelectedFile();
        if (!uploadedFileData) {
          toast.error("Không thể upload file");
          return;
        }
        Object.assign(messageData, uploadedFileData);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi upload file");
        return;
      }
    }

    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConversation,
      sender: "admin",
      text: messageText,
      createdAt: new Date(),
      ...(uploadedFileData && {
        fileUrl: uploadedFileData.fileUrl,
        fileName: uploadedFileData.fileName,
        fileType: uploadedFileData.fileType,
        fileSize: uploadedFileData.fileSize,
      }),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage("");
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    stopTyping();

    currentSocket.emit("send_message", messageData, (response: any) => {
      if (!response || response.error) {
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== tempMessage._id)
        );
        toast.error("Không thể gửi tin nhắn");
        return;
      }
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg._id !== tempMessage._id);
        return [
          ...withoutTemp,
          {
            ...response,
            createdAt: response.createdAt
              ? new Date(response.createdAt)
              : new Date(),
          },
        ];
      });
    });
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    if (!value.trim()) {
      stopTyping();
      return;
    }
    scheduleTypingStatus();
  };

  useEffect(() => {
    if (!token) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [token, fetchConversations]);

  const handleViewInfo = () => {
    setShowInfoModal(true);
    setIsMenuOpen(false);
  };

  const handleArchiveConversation = () => {
    if (!selectedConversation) return;
    setShowDeleteConfirm(true);
    setIsMenuOpen(false);
  };

  const confirmDeleteConversation = async () => {
    if (!selectedConversation) return;
    try {
      await fetch(`${apiUrl}/chat/archive/${selectedConversation}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Đã xóa cuộc trò chuyện");
      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
    } catch (error) {
      toast.error("Không thể xóa cuộc trò chuyện");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const selectedConvData = conversations.find(
    (c) => c.conversationId === selectedConversation
  );
  const isPartnerTyping = selectedConversation
    ? typingStatus[selectedConversation]
    : false;

  return (
    <ProtectedRoute>
      <AdminShell
        title="Chat trực tuyến"
        description="Giám sát tin nhắn và phản hồi khách hàng theo thời gian thực."
        actions={
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              isConnected
                ? "bg-green-500/15 text-green-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {isConnected ? "Đang kết nối" : "Mất kết nối"}
          </span>
        }
      >
        <div
          className="grid gap-2 sm:gap-4 lg:gap-6"
          style={{ gridTemplateColumns: "3fr 7fr" }}
        >
          <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-240px)] min-h-[400px] sm:min-h-[520px] overflow-hidden">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Phòng chat
              </p>
              <h3 className="text-base sm:text-xl font-bold mt-1 sm:mt-2">
                {conversations.length} cuộc trò chuyện
              </h3>
            </div>
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/5 custom-scrollbar"
              data-lenis-prevent
            >
              {conversations.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-white/50 text-sm">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = selectedConversation === conv.conversationId;
                  return (
                    <button
                      key={conv.conversationId}
                      onClick={() =>
                        handleSelectConversation(conv.conversationId)
                      }
                      className={`w-full text-left px-3 sm:px-6 py-2 sm:py-4 transition-colors ${
                        isActive ? "bg-primary/15" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-xs sm:text-sm">
                            {conv.fullName || "Khách"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500/20 text-red-300 text-xs font-bold rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-[18px] sm:min-w-[24px] text-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-white/60 line-clamp-2 mt-1 sm:mt-2">
                        {conv.lastMessage?.text?.trim()
                          ? conv.lastMessage.text
                          : conv.lastMessage?.fileName ||
                            (conv.lastMessage?.fileUrl
                              ? "Đã gửi tệp"
                              : "Chưa có tin nhắn")}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-240px)] min-h-[400px] sm:min-h-[520px] overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="px-4 sm:px-6 py-4 border-b border-white/5 relative">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-2xl font-bold mt-1 truncate">
                        {selectedConvData?.fullName || "Khách"}
                      </h3>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Tùy chọn cuộc trò chuyện"
                      >
                        <svg
                          className="w-5 h-5 text-white/70"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v.01M12 12v.01M12 18v.01"
                          />
                        </svg>
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-3 w-48 rounded-xl border border-white/10 bg-[#0f1628] shadow-xl shadow-black/40 z-10">
                          <button
                            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                            onClick={handleViewInfo}
                          >
                            Xem thông tin
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                            onClick={handleArchiveConversation}
                          >
                            Xóa cuộc trò chuyện
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 custom-scrollbar"
                  data-lenis-prevent
                >
                  {messages.map((message) => {
                    const isAdmin = message.sender === "admin";
                    const hasFile = Boolean(message.fileUrl);
                    const imageFile = isImageFile(
                      message.fileType,
                      message.fileUrl
                    );
                    const displayFileName =
                      message.fileName ||
                      message.fileUrl?.split("/").pop() ||
                      "Tệp đính kèm";
                    const timeLabel = message.createdAt
                      ? new Date(message.createdAt).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "";
                    const fileSizeLabel = formatFileSize(message.fileSize);

                    return (
                      <div
                        key={message._id || message.createdAt?.toString()}
                        className={`flex ${
                          isAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="flex flex-col gap-2 max-w-[70%]">
                          {hasFile && imageFile && message.fileUrl && (
                            <Image
                              src={message.fileUrl}
                              alt={displayFileName}
                              width={800}
                              height={800}
                              sizes="(max-width: 1024px) 80vw, 400px"
                              className="rounded-2xl max-h-80 w-full object-contain border border-white/10 bg-black/20 cursor-pointer"
                              onClick={() =>
                                openFileInNewTab(
                                  message.fileUrl,
                                  message.fileName
                                )
                              }
                              unoptimized
                            />
                          )}

                          {hasFile && !imageFile && (
                            <button
                              type="button"
                              onClick={() =>
                                openFileInNewTab(
                                  message.fileUrl,
                                  message.fileName
                                )
                              }
                              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition-colors"
                            >
                              <span className="p-2 rounded-xl bg-black/30 text-white/80 flex-shrink-0">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V9.414A2 2 0 0016.414 8L13 4.586A2 2 0 0011.586 4H9a2 2 0 00-2 2z"
                                  />
                                </svg>
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {displayFileName}
                                </p>
                                <p className="text-xs text-white/60">
                                  {fileSizeLabel
                                    ? `${fileSizeLabel} • Nhấn để mở`
                                    : "Nhấn để mở"}
                                </p>
                              </div>
                            </button>
                          )}

                          {message.text && (
                            <div
                              className={`rounded-2xl px-5 py-3 shadow-lg ${
                                isAdmin
                                  ? "bg-primary text-white rounded-br-md"
                                  : "bg-white/10 text-white rounded-bl-md border border-white/10"
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                {message.text}
                              </p>
                              <p
                                className={`text-xs mt-2 ${
                                  isAdmin ? "text-white/70" : "text-white/50"
                                }`}
                              >
                                {timeLabel}
                              </p>
                            </div>
                          )}

                          {!message.text && timeLabel && (
                            <p
                              className={`text-xs ${
                                isAdmin
                                  ? "text-white/70 text-right"
                                  : "text-white/50"
                              }`}
                            >
                              {timeLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {isPartnerTyping && (
                  <div className="px-6 pb-1 text-xs text-white/60">
                    Đang soạn tin...
                  </div>
                )}
                {selectedFile && (
                  <div className="px-6 pb-2">
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5">
                      {selectedFile.fileType === "image" ? (
                        <Image
                          src={selectedFile.previewUrl}
                          alt={selectedFile.fileName}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                          unoptimized
                        />
                      ) : (
                        <span className="p-2 rounded-xl bg-white/10 text-white/70">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V9.414A2 2 0 0016.414 8L13 4.586A2 2 0 0011.586 4H9a2 2 0 00-2 2z"
                            />
                          </svg>
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {selectedFile.fileName}
                        </p>
                        <p className="text-xs text-white/60">
                          {(selectedFile.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedFile.previewUrl) {
                            URL.revokeObjectURL(selectedFile.previewUrl);
                          }
                          setSelectedFile(null);
                        }}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70"
                        aria-label="Xóa file"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-white/5 bg-white/5 rounded-b-2xl relative"
                >
                  <div className="flex gap-2 sm:gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="p-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex-shrink-0 text-white/80"
                      aria-label="Chọn emoji"
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
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex-shrink-0 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Tải file"
                    >
                      {uploadingFile ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
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
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file);
                        }
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Nhập nội dung..."
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/60 text-sm sm:text-base"
                      disabled={!isConnected}
                    />
                    <button
                      type="submit"
                      disabled={
                        !isConnected ||
                        uploadingFile ||
                        (!inputMessage.trim() && !selectedFile)
                      }
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <svg
                        className="w-6 h-6"
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
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-full left-3 mb-2 z-20"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        autoFocusSearch={false}
                        theme={Theme.DARK}
                        skinTonesDisabled
                      />
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/50">
                Chọn một cuộc trò chuyện để bắt đầu
              </div>
            )}
          </div>
        </div>
      </AdminShell>
      {showInfoModal && selectedConvData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#050b17] border border-white/10 rounded-2xl w-full max-w-md p-4 sm:p-6 space-y-4 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50 uppercase tracking-[0.3em]">
                  Thông tin khách hàng
                </p>
                <h4 className="text-2xl font-bold mt-2">
                  {selectedConvData.fullName || "Khách"}
                </h4>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Đóng"
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
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/50">Số điện thoại</p>
                <p className="font-semibold">
                  {selectedConvData.phone || "Chưa cung cấp"}
                </p>
              </div>
              <div>
                <p className="text-white/50">Email</p>
                <p className="font-semibold">
                  {selectedConvData.email || "Chưa cung cấp"}
                </p>
              </div>
              <div>
                <p className="text-white/50">Tổng tin nhắn</p>
                <p className="font-semibold">{selectedConvData.messageCount}</p>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa cuộc trò chuyện"
        message="Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={confirmDeleteConversation}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </ProtectedRoute>
  );
}
