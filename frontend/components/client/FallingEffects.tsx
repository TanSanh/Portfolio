"use client";

import { useEffect, useState } from "react";

type EffectType =
  | "snow"
  | "flowers"
  | "stars"
  | "rain"
  | "leaves"
  | "bubbles"
  | "confetti";

interface FallingEffectsProps {
  type?: EffectType;
  intensity?: "low" | "medium" | "high";
  color?: string;
}

export function FallingEffects({
  type = "snow",
  intensity = "medium",
  color = "#ffffff",
}: FallingEffectsProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      speed: number;
      rotation: number;
      rotationSpeed: number;
    }>
  >([]);

  const intensityMap = {
    low: 30,
    medium: 50,
    high: 80,
  };

  const particleCount = intensityMap[intensity];

  useEffect(() => {
    // Tạo particles ban đầu
    const initialParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100 - 100,
      size: getSize(type),
      speed: getSpeed(type),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
    }));

    setParticles(initialParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((particle) => {
          let newY = particle.y + particle.speed;
          let newX = particle.x;

          // Xử lý di chuyển theo loại
          if (type === "snow" || type === "flowers" || type === "leaves") {
            newX += Math.sin(particle.y * 0.01) * 0.5; // Sóng nhẹ
          } else if (type === "rain") {
            newX += (Math.random() - 0.5) * 0.2; // Rung nhẹ
          } else if (type === "bubbles") {
            newX += Math.sin(particle.y * 0.02) * 0.3;
            newY -= 0.1; // Bong bóng bay lên chậm hơn
          }

          // Reset khi ra khỏi màn hình
          if (newY > 110) {
            return {
              ...particle,
              y: -10,
              x: Math.random() * 100,
            };
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            rotation: particle.rotation + particle.rotationSpeed,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [type, intensity, particleCount]);

  function getSize(type: EffectType): number {
    switch (type) {
      case "snow":
        return Math.random() * 4 + 2;
      case "flowers":
        return Math.random() * 8 + 6;
      case "stars":
        return Math.random() * 3 + 2;
      case "rain":
        return Math.random() * 2 + 1;
      case "leaves":
        return Math.random() * 10 + 8;
      case "bubbles":
        return Math.random() * 15 + 10;
      case "confetti":
        return Math.random() * 6 + 4;
      default:
        return 5;
    }
  }

  function getSpeed(type: EffectType): number {
    switch (type) {
      case "snow":
        return Math.random() * 0.5 + 0.3;
      case "flowers":
        return Math.random() * 0.8 + 0.5;
      case "stars":
        return Math.random() * 0.6 + 0.4;
      case "rain":
        return Math.random() * 2 + 1.5;
      case "leaves":
        return Math.random() * 0.7 + 0.4;
      case "bubbles":
        return Math.random() * 0.4 + 0.2;
      case "confetti":
        return Math.random() * 1 + 0.5;
      default:
        return 0.5;
    }
  }

  function renderParticle(particle: (typeof particles)[0]) {
    switch (type) {
      case "snow":
        return (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white opacity-80"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              boxShadow: "0 0 6px rgba(255, 255, 255, 0.8)",
            }}
          />
        );

      case "flowers":
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          >
            <svg viewBox="0 0 24 24" fill={color} opacity="0.7">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
        );

      case "stars":
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              color: color,
              opacity: 0.8,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );

      case "rain":
        return (
          <div
            key={particle.id}
            className="absolute bg-blue-400 opacity-60"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size * 3}px`,
            }}
          />
        );

      case "leaves":
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="#8B4513" opacity="0.7">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C7.69 16.5 9.5 12.17 17 10c-7.5 2.17-9.31 6.5-11.29 12l1.89.66C9.1 16.17 11.17 10 17 8z" />
            </svg>
          </div>
        );

      case "bubbles":
        return (
          <div
            key={particle.id}
            className="absolute rounded-full border-2 border-white/40"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)`,
              boxShadow: `inset 0 0 ${
                particle.size / 2
              }px rgba(255,255,255,0.2)`,
            }}
          />
        );

      case "confetti":
        const colors = [
          "#FF6B6B",
          "#4ECDC4",
          "#45B7D1",
          "#FFA07A",
          "#98D8C8",
          "#F7DC6F",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: `rotate(${particle.rotation}deg)`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: randomColor,
              opacity: 0.8,
            }}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(renderParticle)}
    </div>
  );
}
