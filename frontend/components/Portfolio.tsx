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
  const itemsPerPage = 3;

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
            <div className="w-full max-w-md aspect-square bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 rounded-xl" />
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
            <a
              href="#work"
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors w-fit"
            >
              <span className="truncate">Xem Dự Án</span>
            </a>
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
