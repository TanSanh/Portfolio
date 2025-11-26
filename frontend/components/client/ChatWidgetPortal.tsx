"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";

const LazyChatWidget = dynamic(
  () =>
    import("./ChatWidget").then((mod) => ({
      default: mod.ChatWidget,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary/70 text-white shadow-lg flex items-center justify-center">
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      </div>
    ),
  }
);

export function ChatWidgetPortal() {
  const pathname = usePathname();
  const [widgetMounted, setWidgetMounted] = useState(false);

  const preloadWidget = useCallback(() => {
    // @ts-expect-error: preload chỉ có trong next/dynamic runtime
    LazyChatWidget.preload?.();
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return widgetMounted ? (
    <LazyChatWidget defaultOpen />
  ) : (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
      aria-label="Mở chat hỗ trợ"
      onClick={() => setWidgetMounted(true)}
      onMouseEnter={preloadWidget}
      onFocus={preloadWidget}
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
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
}
