"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TruncatedDetailsProps {
  details: string;
  className?: string;
}

export default function TruncatedDetails({
  details,
  className = "",
}: TruncatedDetailsProps) {
  const [open, setOpen] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  const updateTruncation = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    setIsTruncated(trigger.scrollWidth > trigger.clientWidth);
  };

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  };

  useEffect(() => {
    updateTruncation();

    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(trigger);

    return () => observer.disconnect();
  }, [details]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) {
        return;
      }

      const tooltip = document.getElementById(tooltipId);
      if (tooltip?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, tooltipId]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isTruncated) {
            return;
          }
          setOpen((current) => !current);
          if (!open) {
            requestAnimationFrame(updatePosition);
          }
        }}
        className={`block w-full min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis text-right ${
          isTruncated ? "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" : "cursor-default"
        } transition ${className}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        title={isTruncated ? "לחץ להצגת פירוט מלא" : undefined}
      >
        {details.trim() ? details : "—"}
      </button>

      {open && isTruncated && typeof document !== "undefined"
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="fixed z-[70] max-w-md rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxWidth: "min(24rem, calc(100vw - 2rem))",
              }}
            >
              <p className="whitespace-pre-wrap break-words">{details}</p>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
