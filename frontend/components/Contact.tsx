"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

const contactSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  subject: z.string().min(3, "Chủ đề phải có ít nhất 3 ký tự"),
  message: z.string().min(10, "Tin nhắn phải có ít nhất 10 ký tự"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Gửi tin nhắn thất bại");
      }

      toast.success(
        "Gửi tin nhắn thành công! Tôi sẽ phản hồi sớm nhất có thể."
      );
      reset();
    } catch (error) {
      toast.error("Gửi tin nhắn thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5 lg:gap-8">
          {/* Left Column: Heading and Contact Info */}
          <motion.div
            className="flex flex-col gap-10 lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col gap-3">
              <h2 className="text-4xl font-black leading-tight tracking-[-0.033em] text-white">
                Hãy Cùng Tạo Ra Điều Gì Đó
              </h2>
              <p className="text-base font-normal leading-normal text-text-dark-secondary">
                Có một dự án trong đầu hoặc chỉ muốn chào hỏi? Tôi rất muốn nghe
                từ bạn.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-white">Tìm tôi ở đâu đó</h3>
              <div className="flex flex-col gap-4">
                <a
                  className="flex items-center gap-3 group"
                  href="mailto:hotansanh0304@gmail.com"
                >
                  <svg
                    className="w-5 h-5 text-text-dark-secondary group-hover:text-primary transition-colors"
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
                  <span className="text-sm font-medium text-text-dark-secondary group-hover:text-primary transition-colors">
                    hotansanh0304@gmail.com
                  </span>
                </a>
                <a
                  className="flex items-center gap-3 group"
                  href="tel:0779518027"
                >
                  <svg
                    className="w-5 h-5 text-text-dark-secondary group-hover:text-primary transition-colors"
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
                  <span className="text-sm font-medium text-text-dark-secondary group-hover:text-primary transition-colors">
                    0779518027
                  </span>
                </a>
              </div>
              <div className="flex items-center gap-4">
                <a
                  className="p-2 rounded-full bg-white/5 text-text-dark-secondary hover:bg-primary/20 hover:text-primary transition-colors"
                  href="https://www.facebook.com/share/1ZsRFHeJJo/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  className="p-2 rounded-full bg-white/5 text-text-dark-secondary hover:bg-primary/20 hover:text-primary transition-colors"
                  href="https://github.com/TanSanh"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="flex flex-col w-full">
                  <p className="pb-2 text-base font-medium text-white">
                    Họ và Tên
                  </p>
                  <input
                    {...register("fullName")}
                    className="flex h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-base font-normal leading-normal text-white placeholder:text-text-dark-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20"
                    placeholder="Nhập họ và tên của bạn"
                    type="text"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.fullName.message}
                    </p>
                  )}
                </label>
                <label className="flex flex-col w-full">
                  <p className="pb-2 text-base font-medium text-white">
                    Địa Chỉ Email
                  </p>
                  <input
                    {...register("email")}
                    className="flex h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-base font-normal leading-normal text-white placeholder:text-text-dark-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20"
                    placeholder="Nhập địa chỉ email của bạn"
                    type="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </label>
              </div>
              <label className="flex flex-col w-full">
                <p className="pb-2 text-base font-medium text-white">Chủ Đề</p>
                <input
                  {...register("subject")}
                  className="flex h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-base font-normal leading-normal text-white placeholder:text-text-dark-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20"
                  placeholder="Đây là về điều gì?"
                  type="text"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.subject.message}
                  </p>
                )}
              </label>
              <label className="flex flex-col w-full">
                <p className="pb-2 text-base font-medium text-white">
                  Tin Nhắn
                </p>
                <textarea
                  {...register("message")}
                  className="flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-base font-normal leading-normal text-white placeholder:text-text-dark-secondary focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20"
                  placeholder="Viết tin nhắn của bạn ở đây..."
                  rows={5}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.message.message}
                  </p>
                )}
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">
                  {isSubmitting ? "Đang gửi..." : "Gửi Tin Nhắn"}
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
