"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section className="relative flex items-start justify-center pt-20 pb-16 sm:pt-24 sm:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl w-full">
        <motion.div
          className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div
            className="flex flex-col gap-6 text-center lg:col-span-3 lg:text-left"
            variants={itemVariants}
          >
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-black leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl text-white">
                Lập Trình Viên Backend
              </h1>
              <p className="text-base text-text-dark-secondary sm:text-lg xl:text-xl 2xl:max-w-3xl">
                Tôi chuyên phát triển các hệ thống backend mạnh mẽ, an toàn và
                hiệu quả. Xây dựng APIs RESTful, quản lý cơ sở dữ liệu, và tối
                ưu hóa hiệu suất hệ thống. Đam mê về kiến trúc phần mềm, công
                nghệ backend và giải quyết các thách thức kỹ thuật phức tạp.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="#work"
                className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity sm:w-auto"
              >
                <span className="truncate">Xem Dự Án</span>
              </Link>
              <div className="flex items-center gap-2">
                <a
                  aria-label="Facebook"
                  className="group flex h-12 w-12 items-center justify-center rounded-full bg-transparent hover:bg-white/10 transition-colors"
                  href="https://www.facebook.com/share/1ZsRFHeJJo/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="w-6 h-6 text-text-dark-secondary group-hover:text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  aria-label="GitHub"
                  className="group flex h-12 w-12 items-center justify-center rounded-full bg-transparent hover:bg-white/10 transition-colors"
                  href="https://github.com/TanSanh"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="w-6 h-6 text-text-dark-secondary group-hover:text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Portrait */}
          <motion.div
            className="flex items-center justify-center lg:col-span-2"
            variants={itemVariants}
          >
            <div className="relative aspect-square w-full max-w-sm 2xl:max-w-lg">
              <div className="avatar-glow-container">
                <div className="relative aspect-square w-full overflow-hidden rounded-full ring-4 ring-primary/20 shadow-2xl z-10">
                  <Image
                    src="/assets/avatar.webp"
                    alt="Avatar Tan Sanh"
                    fill
                    priority
                    sizes="(min-width: 1024px) 24rem, 60vw"
                    className="object-cover"
                    placeholder="empty"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="hidden flex-col items-center gap-2 text-center sm:flex mt-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            className="text-text-dark-secondary text-2xl"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
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
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
          <p className="text-xs font-medium uppercase tracking-widest text-text-dark-secondary">
            Cuộn để khám phá
          </p>
        </motion.div>
      </div>
    </section>
  );
}
