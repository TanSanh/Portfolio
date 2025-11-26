"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  _id: string;
  title: string;
  category: string;
  image: string;
  description: string;
}

export function Portfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<string[]>(["Tất Cả"]);
  const [activeFilter, setActiveFilter] = useState("Tất Cả");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const itemsPerPage = 3;

  // Chỉ render SVG sau khi component đã mount trên client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, categoriesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/categories`),
        ]);

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
          setFilters(["Tất Cả", ...categoriesData]);
        }
      } catch (error) {
        // Lỗi khi tải dự án
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProjects =
    activeFilter === "Tất Cả"
      ? projects
      : projects.filter((project) => project.category === activeFilter);

  const paginatedProjects = filteredProjects.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <section id="work" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section with Gradient Card */}
        <div className="mb-12 flex flex-col gap-8 md:flex-row-reverse md:items-center md:gap-12">
          <motion.div
            className="flex-1 w-full flex items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-full max-w-md aspect-square perspective-1000 group sphere-container">
              <div className="absolute inset-0 animate-sphere-3d">
                <div
                  className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-2xl shadow-cyan-500/50 relative overflow-hidden"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Lưới wireframe công nghệ */}
                  {isMounted && (
                    <svg
                      className="absolute inset-0 w-full h-full animate-spin-slow"
                      viewBox="0 0 200 200"
                      style={{ animationDuration: "20s" }}
                    >
                      {/* Kinh tuyến (meridians) */}
                      {[...Array(12)].map((_, i) => {
                        const angle = i * 30;
                        const x1 =
                          Math.round(
                            (100 + 100 * Math.cos((angle * Math.PI) / 180)) * 10
                          ) / 10;
                        const y1 =
                          Math.round(
                            (100 + 100 * Math.sin((angle * Math.PI) / 180)) * 10
                          ) / 10;
                        const x2 =
                          Math.round(
                            (100 - 100 * Math.cos((angle * Math.PI) / 180)) * 10
                          ) / 10;
                        const y2 =
                          Math.round(
                            (100 - 100 * Math.sin((angle * Math.PI) / 180)) * 10
                          ) / 10;
                        return (
                          <line
                            key={`meridian-${i}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(34, 211, 238, 0.5)"
                            strokeWidth="0.8"
                            className="animate-pulse"
                            style={{
                              filter:
                                "drop-shadow(0 0 2px rgba(34, 211, 238, 0.8))",
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        );
                      })}
                      {/* Vĩ tuyến (parallels) */}
                      {[...Array(6)].map((_, i) => {
                        const radius = 20 + i * 30;
                        return (
                          <circle
                            key={`parallel-${i}`}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke="rgba(34, 211, 238, 0.4)"
                            strokeWidth="0.8"
                            className="animate-pulse"
                            style={{
                              animationDelay: `${i * 0.2}s`,
                              filter:
                                "drop-shadow(0 0 2px rgba(34, 211, 238, 0.6))",
                            }}
                          />
                        );
                      })}
                      {/* Điểm nút giao nhau */}
                      {[...Array(12)].map((_, i) => {
                        const angle = i * 30;
                        const x =
                          Math.round(
                            (100 + 80 * Math.cos((angle * Math.PI) / 180)) * 10
                          ) / 10;
                        const y =
                          Math.round(
                            (100 + 80 * Math.sin((angle * Math.PI) / 180)) * 10
                          ) / 10;
                        return (
                          <circle
                            key={`node-${i}`}
                            cx={x}
                            cy={y}
                            r="2"
                            fill="rgba(34, 211, 238, 0.9)"
                            className="animate-pulse"
                            style={{
                              animationDelay: `${i * 0.15}s`,
                              filter:
                                "drop-shadow(0 0 4px rgba(34, 211, 238, 1))",
                            }}
                          />
                        );
                      })}
                    </svg>
                  )}

                  {/* Các điểm sáng công nghệ (nodes) */}
                  {[...Array(8)].map((_, i) => {
                    const angle = i * 45 * (Math.PI / 180);
                    const radius = 40;
                    const x = 50 + radius * Math.cos(angle);
                    const y = 50 + radius * Math.sin(angle);
                    return (
                      <div
                        key={`node-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-pulse"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          animationDelay: `${i * 0.15}s`,
                          boxShadow:
                            "0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.6)",
                        }}
                      />
                    );
                  })}

                  {/* Điểm sáng chính - glow effect */}
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-cyan-400/40 blur-3xl animate-pulse" />
                  <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-blue-400/30 blur-2xl" />

                  {/* Vòng tròn công nghệ để tạo độ sâu */}
                  <div className="absolute inset-4 rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
                  <div className="absolute inset-8 rounded-full border border-cyan-400/20" />
                  <div className="absolute inset-12 rounded-full border border-cyan-400/10" />

                  {/* Hiệu ứng ánh sáng phản chiếu */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 via-transparent to-transparent" />

                  {/* Hiệu ứng scan line */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scan" />
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="flex-1 flex flex-col gap-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-black leading-tight tracking-tighter sm:text-5xl lg:text-6xl text-white">
              Xây Dựng Hệ Thống Backend Mạnh Mẽ & Hiệu Quả
            </h2>
            <p className="text-base font-normal leading-normal text-text-dark-secondary sm:text-lg">
              Chuyên phát triển các giải pháp backend scalable, an toàn và hiệu
              suất cao. Từ RESTful APIs đến microservices, từ database design
              đến system architecture.
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-3 flex-wrap items-center justify-center">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setCurrentPage(0);
              }}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${
                activeFilter === filter
                  ? "bg-primary text-white"
                  : "bg-white/5 text-text-dark-secondary hover:bg-white/10"
              }`}
            >
              <p className="text-sm font-medium leading-normal">{filter}</p>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="relative w-full overflow-hidden mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-white/5 animate-pulse"
                  />
                ))
              ) : paginatedProjects.length > 0 ? (
                paginatedProjects.map((project) => (
                  <motion.div
                    key={project._id}
                    className="group relative cursor-pointer"
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${project.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-6 text-white transition-opacity duration-300 group-hover:opacity-0">
                      <h3 className="text-xl font-bold">{project.title}</h3>
                    </div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-2xl font-bold mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        {project.title}
                      </h3>
                      <p className="text-sm text-white/80 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out delay-75">
                        {project.description}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-text-dark-secondary">Chưa có dự án nào.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/5 text-text-dark-secondary hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Xem nhóm dự án trước"
            title="Dự án trước"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/5 text-text-dark-secondary hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Xem nhóm dự án tiếp theo"
            title="Dự án tiếp theo"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
