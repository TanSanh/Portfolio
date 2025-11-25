"use client";

import { motion } from "framer-motion";

const services = [
  {
    icon: "code",
    title: "Phát Triển API",
    description:
      "Xây dựng RESTful APIs và GraphQL endpoints với authentication, validation và error handling chuyên nghiệp.",
  },
  {
    icon: "database",
    title: "Thiết Kế Database",
    description:
      "Thiết kế và tối ưu hóa cơ sở dữ liệu, viết queries hiệu quả và quản lý migrations.",
  },
  {
    icon: "server",
    title: "Kiến Trúc Backend",
    description:
      "Thiết kế kiến trúc backend scalable, maintainable với microservices hoặc monolithic architecture.",
  },
  {
    icon: "security",
    title: "Bảo Mật & Tối Ưu",
    description:
      "Triển khai các biện pháp bảo mật, tối ưu hóa hiệu suất và xử lý lỗi toàn diện.",
  },
];

export function Services() {
  return (
    <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-start gap-3 mb-12">
          <div className="flex min-w-72 flex-col gap-3">
            <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em] text-white">
              Tôi Làm Gì
            </h2>
            <p className="text-base font-normal leading-normal text-text-dark-secondary">
              Tôi xây dựng các hệ thống backend mạnh mẽ, an toàn và hiệu quả cho
              các ứng dụng web và di động.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="flex h-full flex-1 flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-primary text-4xl">
                {service.icon === "code" && (
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                  </svg>
                )}
                {service.icon === "database" && (
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3C6.48 3 2 4.79 2 7s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zM2 9v6c0 2.21 4.48 4 10 4s10-1.79 10-4V9c0 2.21-4.48 4-10 4S2 11.21 2 9zm0 8v6c0 2.21 4.48 4 10 4s10-1.79 10-4v-6c0 2.21-4.48 4-10 4S2 19.21 2 17z" />
                  </svg>
                )}
                {service.icon === "server" && (
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 6H4V6h16v4zm0 4H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H4v-4h16v4z" />
                  </svg>
                )}
                {service.icon === "security" && (
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                )}
              </div>
              <div className="flex h-full flex-col gap-2">
                <h3 className="text-lg font-bold leading-tight text-white">
                  {service.title}
                </h3>
                <p className="text-sm font-normal leading-normal text-text-dark-secondary">
                  {service.description}
                </p>
                <a
                  className="text-primary text-sm font-semibold mt-auto pt-4 hover:underline"
                  href="#"
                >
                  Tìm Hiểu Thêm
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          className="flex px-4 py-8 justify-center text-center flex-col items-center gap-4 mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white">
            Sẵn sàng bắt đầu một dự án?
          </h3>
          <p className="text-text-dark-secondary max-w-md">
            Hãy hợp tác để tạo ra điều gì đó tuyệt vời. Liên hệ để thảo luận ý
            tưởng của bạn và nhận báo giá cá nhân hóa.
          </p>
          <a
            href="#contact"
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors mt-4"
          >
            <span className="truncate">Yêu Cầu Báo Giá</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
