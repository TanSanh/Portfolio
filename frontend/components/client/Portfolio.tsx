"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [flowProgress, setFlowProgress] = useState(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: -20, y: 45 });
  const cubeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isDragging) return;

    const interval = setInterval(() => {
      setFlowProgress((prev) => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [isDragging]);

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

  const updateRotation = () => {
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    rotationRef.current = rotation;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    rotationRef.current = {
      x: rotationRef.current.x - deltaY * 0.5,
      y: rotationRef.current.y + deltaX * 0.5,
    };

    dragStartRef.current = { x: e.clientX, y: e.clientY };

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        updateRotation();
        animationFrameRef.current = null;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRotation({ ...rotationRef.current });
  };
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      rotationRef.current = {
        x: rotationRef.current.x - deltaY * 0.5,
        y: rotationRef.current.y + deltaX * 0.5,
      };

      dragStartRef.current = { x: e.clientX, y: e.clientY };

      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          updateRotation();
          animationFrameRef.current = null;
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setRotation({ ...rotationRef.current });
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  const generateBackendArchitecture = useMemo(() => {
    const cubeSize = 180;
    const gridSize = 3;
    const spacing = cubeSize / (gridSize - 1);
    const halfSize = cubeSize / 2;

    const layers = [
      { type: "api", color: "#06b6d4", label: "API Layer" },
      { type: "service", color: "#3b82f6", label: "Service Layer" },
      { type: "cache", color: "#f59e0b", label: "Cache Layer" },
      { type: "database", color: "#10b981", label: "Database Layer" },
    ];

    const nodes: Array<{
      x: number;
      y: number;
      z: number;
      type: string;
      layerIndex: number;
      isCorner: boolean;
      isEdge: boolean;
      face: string;
    }> = [];
    const edges: Array<{ from: number; to: number }> = [];
    const dataFlows: Array<{
      from: { x: number; y: number; z: number };
      to: { x: number; y: number; z: number };
      progress: number;
    }> = [];

    // Mặt trước - API Layer
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const nodeX = (x - (gridSize - 1) / 2) * spacing;
        const nodeY = (y - (gridSize - 1) / 2) * spacing;
        const nodeZ = halfSize;
        const isCorner =
          (x === 0 || x === gridSize - 1) && (y === 0 || y === gridSize - 1);
        const isEdge =
          x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          type: "api",
          layerIndex: 0,
          isCorner,
          isEdge,
          face: "front",
        });
      }
    }

    // Mặt sau - Database Layer
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const nodeX = (x - (gridSize - 1) / 2) * spacing;
        const nodeY = (y - (gridSize - 1) / 2) * spacing;
        const nodeZ = -halfSize;
        const isCorner =
          (x === 0 || x === gridSize - 1) && (y === 0 || y === gridSize - 1);
        const isEdge =
          x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          type: "database",
          layerIndex: 3,
          isCorner,
          isEdge,
          face: "back",
        });
      }
    }

    // Mặt trên - Service Layer
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const nodeX = (x - (gridSize - 1) / 2) * spacing;
        const nodeY = halfSize;
        const nodeZ = (z - (gridSize - 1) / 2) * spacing;
        const isCorner =
          (x === 0 || x === gridSize - 1) && (z === 0 || z === gridSize - 1);
        const isEdge =
          x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          type: "service",
          layerIndex: 1,
          isCorner,
          isEdge,
          face: "top",
        });
      }
    }

    // Mặt dưới - Cache Layer
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const nodeX = (x - (gridSize - 1) / 2) * spacing;
        const nodeY = -halfSize;
        const nodeZ = (z - (gridSize - 1) / 2) * spacing;
        const isCorner =
          (x === 0 || x === gridSize - 1) && (z === 0 || z === gridSize - 1);
        const isEdge =
          x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          type: "cache",
          layerIndex: 2,
          isCorner,
          isEdge,
          face: "bottom",
        });
      }
    }

    // Mặt phải
    for (let y = 1; y < gridSize - 1; y++) {
      for (let z = 1; z < gridSize - 1; z++) {
        const nodeX = halfSize;
        const nodeY = (y - (gridSize - 1) / 2) * spacing;
        const nodeZ = (z - (gridSize - 1) / 2) * spacing;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          type: "service",
          layerIndex: 1,
          isCorner: false,
          isEdge: true,
          face: "right",
        });
      }
    }

    // Mặt trái
    for (let y = 1; y < gridSize - 1; y++) {
      for (let z = 1; z < gridSize - 1; z++) {
        const nodeX = -halfSize;
        const nodeY = (y - (gridSize - 1) / 2) * spacing;
        const nodeZ = (z - (gridSize - 1) / 2) * spacing;

        nodes.push({
          x: nodeX,
          y: nodeY,
          z: nodeZ,
          type: "cache",
          layerIndex: 2,
          isCorner: false,
          isEdge: true,
          face: "left",
        });
      }
    }

    nodes.forEach((node1, i) => {
      nodes.forEach((node2, j) => {
        if (i >= j) return;
        if (node1.face !== node2.face) return;

        const dx = Math.abs(node1.x - node2.x);
        const dy = Math.abs(node1.y - node2.y);
        const dz = Math.abs(node1.z - node2.z);

        const isAdjacent =
          (dx === spacing && dy === 0 && dz === 0) ||
          (dx === 0 && dy === spacing && dz === 0) ||
          (dx === 0 && dy === 0 && dz === spacing);

        if (isAdjacent) {
          edges.push({ from: i, to: j });
        }
      });
    });

    nodes.forEach((node1, i) => {
      nodes.forEach((node2, j) => {
        if (i >= j) return;
        if (node1.face === node2.face) return;

        const dx = Math.abs(node1.x - node2.x);
        const dy = Math.abs(node1.y - node2.y);
        const dz = Math.abs(node1.z - node2.z);
        if (
          (dx === 0 && dy === 0 && dz === cubeSize) ||
          (dx === 0 && dy === cubeSize && dz === 0) ||
          (dx === cubeSize && dy === 0 && dz === 0)
        ) {
          edges.push({ from: i, to: j });
        }
      });
    });

    const apiNodes = nodes.filter((n) => n.type === "api" && n.isCorner);
    const serviceNodes = nodes.filter(
      (n) => n.type === "service" && n.isCorner
    );
    const cacheNodes = nodes.filter((n) => n.type === "cache" && n.isCorner);
    const dbNodes = nodes.filter((n) => n.type === "database" && n.isCorner);
    if (apiNodes.length > 0 && serviceNodes.length > 0) {
      dataFlows.push({
        from: { x: apiNodes[0].x, y: apiNodes[0].y, z: apiNodes[0].z },
        to: {
          x: serviceNodes[0].x,
          y: serviceNodes[0].y,
          z: serviceNodes[0].z,
        },
        progress: 0,
      });
    }

    if (serviceNodes.length > 0 && cacheNodes.length > 0) {
      dataFlows.push({
        from: {
          x: serviceNodes[0].x,
          y: serviceNodes[0].y,
          z: serviceNodes[0].z,
        },
        to: { x: cacheNodes[0].x, y: cacheNodes[0].y, z: cacheNodes[0].z },
        progress: 33,
      });
    }
    if (cacheNodes.length > 0 && dbNodes.length > 0) {
      dataFlows.push({
        from: { x: cacheNodes[0].x, y: cacheNodes[0].y, z: cacheNodes[0].z },
        to: { x: dbNodes[0].x, y: dbNodes[0].y, z: dbNodes[0].z },
        progress: 66,
      });
    }

    return { nodes, edges, dataFlows, layers };
  }, []);

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
            <div
              className="relative w-full max-w-md aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ perspective: "1000px" }}
            >
              <div
                ref={cubeRef}
                className="relative"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                  willChange: "transform",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
              >
                {(() => {
                  const { nodes, edges, dataFlows, layers } =
                    generateBackendArchitecture;

                  const getLayerColor = (type: string) => {
                    switch (type) {
                      case "api":
                        return "#06b6d4";
                      case "service":
                        return "#3b82f6";
                      case "cache":
                        return "#f59e0b";
                      case "database":
                        return "#10b981";
                      default:
                        return "#6366f1";
                    }
                  };

                  return (
                    <>
                      {edges
                        .filter((edge) => {
                          const from = nodes[edge.from];
                          const to = nodes[edge.to];
                          return (
                            from &&
                            to &&
                            (from.isCorner ||
                              from.isEdge ||
                              to.isCorner ||
                              to.isEdge)
                          );
                        })
                        .map((edge, index) => {
                          const from = nodes[edge.from];
                          const to = nodes[edge.to];
                          if (!from || !to) return null;

                          const length = Math.sqrt(
                            Math.pow(to.x - from.x, 2) +
                              Math.pow(to.y - from.y, 2) +
                              Math.pow(to.z - from.z, 2)
                          );
                          const midX = (from.x + to.x) / 2;
                          const midY = (from.y + to.y) / 2;
                          const midZ = (from.z + to.z) / 2;

                          const dx = to.x - from.x;
                          const dy = to.y - from.y;
                          const dz = to.z - from.z;
                          const rotY = Math.atan2(dx, dz) * (180 / Math.PI);
                          const rotX =
                            -Math.asin(dy / length) * (180 / Math.PI);
                          const color = getLayerColor(from.type);
                          const isSameFace = from.face === to.face;

                          return (
                            <div
                              key={`edge-${index}`}
                              className="absolute origin-center"
                              style={{
                                transformStyle: "preserve-3d",
                                transform: `translate3d(${midX}px, ${midY}px, ${midZ}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
                                width: `${length}px`,
                                height: isSameFace ? "1.5px" : "1px",
                                background: isSameFace
                                  ? `linear-gradient(90deg, transparent, ${color}80, ${color}, ${color}80, transparent)`
                                  : "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)",
                                boxShadow: isSameFace
                                  ? `0 0 3px ${color}60, 0 0 6px ${color}30`
                                  : "0 0 2px rgba(6,182,212,0.3)",
                              }}
                            />
                          );
                        })}

                      {dataFlows.map((flow, index) => {
                        const progress = (flow.progress + flowProgress) % 100;
                        const currentX =
                          flow.from.x +
                          ((flow.to.x - flow.from.x) * progress) / 100;
                        const currentY =
                          flow.from.y +
                          ((flow.to.y - flow.from.y) * progress) / 100;
                        const currentZ =
                          flow.from.z +
                          ((flow.to.z - flow.from.z) * progress) / 100;

                        return (
                          <div
                            key={`flow-${index}`}
                            className="absolute"
                            style={{
                              transformStyle: "preserve-3d",
                              transform: `translate3d(${currentX}px, ${currentY}px, ${currentZ}px)`,
                            }}
                          >
                            <div
                              className="absolute rounded-full animate-pulse"
                              style={{
                                width: "8px",
                                height: "8px",
                                left: "-4px",
                                top: "-4px",
                                background:
                                  "radial-gradient(circle, #06b6d4, #0891b2)",
                                boxShadow:
                                  "0 0 10px rgba(6,182,212,1), 0 0 20px rgba(6,182,212,0.6)",
                              }}
                            />
                          </div>
                        );
                      })}

                      {nodes.map((node, index) => {
                        const color = getLayerColor(node.type);
                        const size = node.isCorner ? 20 : node.isEdge ? 14 : 10;
                        const showIcon = node.isCorner || node.isEdge;

                        return (
                          <div
                            key={`node-${index}`}
                            className="absolute"
                            style={{
                              transformStyle: "preserve-3d",
                              transform: `translate3d(${node.x}px, ${node.y}px, ${node.z}px)`,
                            }}
                          >
                            {node.type === "database" && (
                              <>
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={`disc-${i}`}
                                    className="absolute"
                                    style={{
                                      left: "-10px",
                                      top: `${-10 + i * 4}px`,
                                      width: "20px",
                                      height: "5px",
                                      borderRadius: "2px",
                                      background:
                                        i === 0
                                          ? `linear-gradient(90deg, ${color}, ${color}dd)`
                                          : `linear-gradient(90deg, ${color}80, ${color}60)`,
                                      boxShadow:
                                        i === 0
                                          ? `0 0 10px ${color}cc, 0 0 20px ${color}80`
                                          : `0 0 6px ${color}60`,
                                      border: `1px solid ${color}60`,
                                    }}
                                  />
                                ))}
                              </>
                            )}

                            {node.type !== "database" && (
                              <div
                                className={`absolute rounded-full ${
                                  node.isCorner ? "animate-pulse" : ""
                                }`}
                                style={{
                                  width: `${size}px`,
                                  height: `${size}px`,
                                  left: `-${size / 2}px`,
                                  top: `-${size / 2}px`,
                                  background: node.isCorner
                                    ? `radial-gradient(circle, ${color}, ${color}dd)`
                                    : `radial-gradient(circle, ${color}80, ${color}60)`,
                                  boxShadow: node.isCorner
                                    ? `0 0 16px ${color}cc, 0 0 32px ${color}80, inset 0 0 8px ${color}40`
                                    : `0 0 6px ${color}60, 0 0 12px ${color}30`,
                                }}
                              />
                            )}

                            {showIcon && (
                              <div
                                className="absolute"
                                style={{
                                  left: node.isCorner ? "-14px" : "-12px",
                                  top: node.isCorner ? "-14px" : "-12px",
                                  width: node.isCorner ? "28px" : "24px",
                                  height: node.isCorner ? "28px" : "24px",
                                  transformStyle: "preserve-3d",
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backdropFilter: "blur(4px)",
                                }}
                              >
                                {node.type === "api" && (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-full h-full"
                                    style={{
                                      color: "#ffffff",
                                      filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`,
                                      padding: "4px",
                                    }}
                                  >
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                )}
                                {node.type === "service" && (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-full h-full"
                                    style={{
                                      color: "#ffffff",
                                      filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`,
                                      padding: "4px",
                                    }}
                                  >
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 6H4V6h16v4zm0 4H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H4v-4h16v4z" />
                                  </svg>
                                )}
                                {node.type === "cache" && (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-full h-full"
                                    style={{
                                      color: "#ffffff",
                                      filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`,
                                      padding: "4px",
                                    }}
                                  >
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                                  </svg>
                                )}
                                {node.type === "database" && (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-full h-full"
                                    style={{
                                      color: "#ffffff",
                                      filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`,
                                      padding: "4px",
                                    }}
                                  >
                                    <path d="M12 3C6.48 3 2 4.79 2 7s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zM2 9v6c0 2.21 4.48 4 10 4s10-1.79 10-4V9c0 2.21-4.48 4-10 4S2 11.21 2 9zm0 8v6c0 2.21 4.48 4 10 4s10-1.79 10-4v-6c0 2.21-4.48 4-10 4S2 19.21 2 17z" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/15 blur-2xl rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 blur-3xl rounded-full" />
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
