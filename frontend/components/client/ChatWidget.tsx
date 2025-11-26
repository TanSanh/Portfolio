"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

interface Message {
  _id?: string;
  id?: string;
  text: string;
  sender: "user" | "admin";
  timestamp?: Date;
  createdAt?: Date;
  conversationId?: string;
  isRead?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

const NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{2,20}$/;
const PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

interface ChatWidgetProps {
  defaultOpen?: boolean;
}

export function ChatWidget({ defaultOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
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

  const openFileInNewTab = (fileUrl?: string, fileName?: string) => {
    if (!fileUrl) return;
    const getExtension = (value?: string) => {
      if (!value) return "";
      const sanitized = value.split("?")[0];
      const parts = sanitized.split(".");
      return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
    };

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Khôi phục trạng thái từ localStorage khi component mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem("chat_conversationId");
    const savedFormData = localStorage.getItem("chat_formData");
    const savedIsStarted = localStorage.getItem("chat_isStarted");

    if (savedConversationId && savedFormData && savedIsStarted === "true") {
      try {
        const parsedFormData = JSON.parse(savedFormData);
        setConversationId(savedConversationId);
        setFormData(parsedFormData);
        setIsStarted(true);

        // Fetch lại messages
        const fetchMessages = async () => {
          try {
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(
              `${apiUrl}/chat/messages/${savedConversationId}`
            );
            if (response.ok) {
              const messages = await response.json();
              setMessages(
                messages.map((msg: Message) => ({
                  ...msg,
                  id: msg._id || msg.id || `msg-${Date.now()}`,
                  timestamp: msg.createdAt
                    ? new Date(msg.createdAt)
                    : msg.timestamp || new Date(),
                }))
              );
            }
          } catch (error) {
            console.error("Error fetching messages:", error);
          }
        };
        fetchMessages();
      } catch (error) {
        console.error("Error restoring chat state:", error);
        // Clear invalid data
        localStorage.removeItem("chat_conversationId");
        localStorage.removeItem("chat_formData");
        localStorage.removeItem("chat_isStarted");
      }
    }
  }, []);

  // Lưu conversationId vào localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem("chat_conversationId", conversationId);
    } else {
      localStorage.removeItem("chat_conversationId");
    }
  }, [conversationId]);

  // Lưu formData vào localStorage
  useEffect(() => {
    if (isStarted && formData.fullName) {
      localStorage.setItem("chat_formData", JSON.stringify(formData));
    } else {
      localStorage.removeItem("chat_formData");
    }
  }, [formData, isStarted]);

  // Lưu isStarted vào localStorage
  useEffect(() => {
    if (isStarted) {
      localStorage.setItem("chat_isStarted", "true");
    } else {
      localStorage.removeItem("chat_isStarted");
    }
  }, [isStarted]);

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

    // Kết nối khi widget mở hoặc đã bắt đầu chat (để nhận messages ngay cả khi widget đóng)
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
          text: message.text || "",
          timestamp: message.createdAt
            ? new Date(message.createdAt)
            : message.timestamp || new Date(),
          isRead: message.isRead,
          // Đảm bảo file info được copy
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          fileType: message.fileType,
          fileSize: message.fileSize,
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
            text: msg.text || "",
            timestamp: msg.createdAt
              ? new Date(msg.createdAt)
              : msg.timestamp || new Date(),
            isRead: msg.isRead,
            // Đảm bảo file info được copy
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileType: msg.fileType,
            fileSize: msg.fileSize,
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
    // stopTyping chỉ cần chạy khi unmount nên bỏ qua dependency warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đóng emoji picker khi click bên ngoài
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
    const fullName = formData.fullName.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();

    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    if (!NAME_REGEX.test(fullName)) {
      toast.error("Họ tên phải từ 2-20 ký tự, chỉ gồm chữ cái và khoảng trắng");
      return;
    }
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast.error(
        "Số điện thoại không hợp lệ. Dùng định dạng Việt Nam (0/+84)."
      );
      return;
    }
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Email không đúng định dạng");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/chat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, phone, email }),
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const messageText = inputMessage.trim() || "";
    const messageData: any = {
      conversationId,
      sender: "user" as const,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
    };

    if (messageText) {
      messageData.text = messageText;
    }

    if (!messageText && !selectedFile) {
      toast.error("Vui lòng nhập tin nhắn hoặc chọn file");
      return;
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
      id: `temp-${Date.now()}`,
      text: messageText || "",
      sender: "user",
      timestamp: new Date(),
      conversationId,
      isRead: false,
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

    socket.emit("send_message", messageData, (response: any) => {
      if (response && response.error) {
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
              text: response.text || "",
              timestamp: response.createdAt
                ? new Date(response.createdAt)
                : new Date(),
              isRead: response.isRead,
              fileUrl: response.fileUrl,
              fileName: response.fileName,
              fileType: response.fileType,
              fileSize: response.fileSize,
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
      text: message.text || "",
      sender: message.sender,
      timestamp: message.createdAt
        ? new Date(message.createdAt)
        : message.timestamp || new Date(),
      conversationId: message.conversationId,
      isRead: message.isRead,
      // Đảm bảo file info được copy
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileType: message.fileType,
      fileSize: message.fileSize,
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
            style={{
              maxHeight: "90vh",
              height: isStarted ? "600px" : "auto",
            }}
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

                  <form
                    onSubmit={handleStartChat}
                    noValidate
                    className="space-y-4"
                  >
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
                        placeholder="VD: Hồ Tấn Sanh"
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
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="VD: 0987 000 000"
                        title="Sử dụng số Việt Nam bắt đầu bằng 0 hoặc +84 và gồm 10 chữ số"
                        inputMode="tel"
                        maxLength={12}
                        minLength={10}
                        required
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
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="VD: hovaten@gmail.com"
                        required
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
                          {/* Nếu chỉ có file/ảnh không có text, hiển thị đơn giản không bo viền */}
                          {formatted.fileUrl && !formatted.text ? (
                            <div className="max-w-[80%]">
                              {formatted.fileType === "image" ? (
                                <img
                                  src={formatted.fileUrl}
                                  alt={formatted.fileName || "Image"}
                                  className="max-w-full max-h-64 object-contain cursor-pointer"
                                  onClick={() =>
                                    openFileInNewTab(
                                      formatted.fileUrl,
                                      formatted.fileName
                                    )
                                  }
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openFileInNewTab(
                                      formatted.fileUrl,
                                      formatted.fileName
                                    )
                                  }
                                  className="flex items-center gap-2 p-2 hover:opacity-80 transition-opacity w-full text-left"
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
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {formatted.fileName || "File"}
                                    </p>
                                    {formatted.fileSize && (
                                      <p className="text-xs opacity-70">
                                        {(formatted.fileSize / 1024).toFixed(2)}{" "}
                                        KB
                                      </p>
                                    )}
                                  </div>
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
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </button>
                              )}
                              <div
                                className={`flex items-center gap-2 mt-1 ${
                                  formatted.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <p className="text-xs opacity-70">
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
                                    <span className="text-[10px] uppercase tracking-wide opacity-70">
                                      Đã xem
                                    </span>
                                  )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                formatted.sender === "user"
                                  ? "bg-primary text-white"
                                  : "bg-background-dark-secondary text-text-dark-primary border border-white/10"
                              }`}
                            >
                              {/* Hiển thị file/ảnh */}
                              {formatted.fileUrl && (
                                <div className="mb-2">
                                  {formatted.fileType === "image" ? (
                                    <img
                                      src={formatted.fileUrl}
                                      alt={formatted.fileName || "Image"}
                                      className="max-w-full max-h-64 rounded-lg object-contain cursor-pointer"
                                      onClick={() =>
                                        openFileInNewTab(
                                          formatted.fileUrl,
                                          formatted.fileName
                                        )
                                      }
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openFileInNewTab(
                                          formatted.fileUrl,
                                          formatted.fileName
                                        )
                                      }
                                      className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors w-full text-left"
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
                                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {formatted.fileName || "File"}
                                        </p>
                                        {formatted.fileSize && (
                                          <p className="text-xs opacity-70">
                                            {(
                                              formatted.fileSize / 1024
                                            ).toFixed(2)}{" "}
                                            KB
                                          </p>
                                        )}
                                      </div>
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
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Hiển thị text */}
                              {formatted.text && (
                                <p className="text-sm break-words whitespace-pre-wrap">
                                  {formatted.text}
                                </p>
                              )}
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
                          )}
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
                  {/* Selected file preview */}
                  {selectedFile && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                        {selectedFile.fileType === "image" ? (
                          <img
                            src={selectedFile.previewUrl}
                            alt={selectedFile.fileName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-white/70"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {selectedFile.fileName}
                          </p>
                          <p className="text-xs text-white/70">
                            {(selectedFile.fileSize / 1024).toFixed(2)} KB
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
                          className="p-1 rounded-full hover:bg-white/10 transition-colors"
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
                    className="border-t border-white/10 p-4 bg-background-dark-secondary relative"
                  >
                    <div className="flex gap-2 relative items-center">
                      {/* Emoji picker button */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
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
                      {/* File upload button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file);
                          }
                          e.target.value = ""; // Reset input
                        }}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      />
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
                        disabled={
                          uploadingFile ||
                          (!inputMessage.trim() && !selectedFile)
                        }
                        className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
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
                    {/* Emoji picker */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-0 mb-2 z-50"
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
