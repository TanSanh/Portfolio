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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/projects`
        );

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProjects = projects;

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredProjects.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === filteredProjects.length - 1 ? 0 : prev + 1
    );
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section id="work" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
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
                  {isMounted && (
                    <svg
                      className="absolute inset-0 w-full h-full animate-spin-slow"
                      viewBox="0 0 200 200"
                      style={{ animationDuration: "20s" }}
                    >
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

                  <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-cyan-400/40 blur-3xl animate-pulse" />
                  <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-blue-400/30 blur-2xl" />

                  <div className="absolute inset-4 rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
                  <div className="absolute inset-8 rounded-full border border-cyan-400/20" />
                  <div className="absolute inset-12 rounded-full border border-cyan-400/10" />

                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 via-transparent to-transparent" />

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

        {!loading && filteredProjects.length > 0 && (
          <div className="flex justify-center gap-2 mb-3">
            {filteredProjects.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to project ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-full overflow-visible">
        <div className="relative w-full mb-8 overflow-visible">
          {loading ? (
            <div className="flex justify-center items-center h-[500px]">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/5 animate-pulse" />
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="relative h-[520px] w-full flex items-center justify-center overflow-visible">
              <div
                className="relative w-full max-w-[100vw] h-full flex items-center justify-center"
                style={{
                  perspective: "2000px",
                  perspectiveOrigin: "center center",
                }}
              >
                {(() => {
                  const totalProjects = filteredProjects.length;
                  if (totalProjects === 0) return null;

                  const displayCards: Array<{
                    project: Project;
                    displayIndex: number;
                    offset: number;
                  }> = [];

                  for (let i = -3; i <= 3; i++) {
                    const actualIndex =
                      (((currentIndex + i) % totalProjects) + totalProjects) %
                      totalProjects;
                    displayCards.push({
                      project: filteredProjects[actualIndex],
                      displayIndex: actualIndex,
                      offset: i,
                    });
                  }

                  return displayCards.map(
                    ({ project, displayIndex, offset }) => {
                      const absOffset = Math.abs(offset);
                      const isActive = offset === 0;

                      let scale = 1;
                      let opacity = 1;
                      let zIndex = 0;
                      let glowOpacity = 0.6;
                      let rotationY = 0;
                      let translateZ = 0;

                      if (isActive) {
                        scale = 1;
                        opacity = 1;
                        zIndex = 10;
                        glowOpacity = 0.6;
                        rotationY = 0;
                        translateZ = 0;
                      } else if (absOffset === 1) {
                        scale = 0.98;
                        opacity = 0.95;
                        zIndex = 8;
                        glowOpacity = 0.55;
                        rotationY = -offset * 40;
                        translateZ = -30;
                      } else if (absOffset === 2) {
                        scale = 0.75;
                        opacity = 0.7;
                        zIndex = 4;
                        glowOpacity = 0.25;
                        rotationY = -offset * 30;
                        translateZ = -150;
                      } else if (absOffset === 3) {
                        scale = 0.45;
                        opacity = 0.4;
                        zIndex = 1;
                        glowOpacity = 0.1;
                        rotationY = -offset * 30;
                        translateZ = -250;
                      }

                      const radius = 540;
                      const angleStep = 30;
                      const angle = offset * angleStep * (Math.PI / 180);
                      const translateX = Math.sin(angle) * radius + offset * 60;
                      const translateY = -Math.cos(angle) * radius * 0.15 + 65;

                      return (
                        <motion.div
                          key={project._id}
                          layout
                          className="absolute w-full max-w-sm cursor-pointer h-[460px]"
                          style={{
                            zIndex,
                            transformOrigin: "center center",
                            transformStyle: "preserve-3d",
                          }}
                          initial={false}
                          animate={{
                            x: translateX,
                            y: translateY,
                            z: translateZ,
                            rotateY: rotationY,
                            scale,
                            opacity,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                            mass: 0.6,
                          }}
                          onClick={() => handleDotClick(displayIndex)}
                        >
                          <div
                            className="relative w-full h-full group flex flex-col"
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            <div
                              className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary via-cyan-500 to-indigo-500 blur-md transition-opacity duration-300"
                              style={{ opacity: glowOpacity }}
                            />

                            <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black/60 backdrop-blur-sm border-2 border-white/20 flex flex-col shadow-2xl">
                              <div className="relative w-full h-[220px] overflow-hidden">
                                <div
                                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                  style={{
                                    backgroundImage: `url(${project.image})`,
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              </div>

                              <div className="p-6 flex flex-1 flex-col gap-4 bg-black/40 backdrop-blur-sm">
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                                  {project.title}
                                </h3>

                                <p className="text-sm text-white/90 leading-relaxed line-clamp-3">
                                  {project.description}
                                </p>

                                <div className="mt-auto">
                                  <button className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-primary via-cyan-500 to-indigo-500 text-white font-bold uppercase tracking-wide hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.02]">
                                    Khám Phá
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-dark-secondary">Chưa có dự án nào.</p>
            </div>
          )}
        </div>

        {!loading && filteredProjects.length > 1 && (
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={handlePrev}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/5 text-text-dark-secondary hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="Dự án trước"
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
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/5 text-text-dark-secondary hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="Dự án tiếp theo"
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
        )}
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"></div>
    </section>
  );
}
