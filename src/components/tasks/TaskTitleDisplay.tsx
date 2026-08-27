"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TaskTitleDisplayProps {
  title: string;
  className?: string;
  delayMs?: number;
}

export default function TaskTitleDisplay({
  title,
  className = "",
  delayMs = 0,
}: TaskTitleDisplayProps) {
  const [open, setOpen] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      left: rect.right,
    });
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (!isTruncated) {
      return;
    }
    clearTimer();
    if (delayMs <= 0) {
      updatePosition();
      setOpen(true);
      return;
    }
    timerRef.current = setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => {
    updateTruncation();

    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(trigger);

    return () => {
      observer.disconnect();
      clearTimer();
    };
  }, [title]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const handleScroll = () => updatePosition();
    window.addEventListener("resize", handleScroll);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={isTruncated ? handleMouseEnter : undefined}
        onBlur={handleMouseLeave}
        className={`block w-full truncate whitespace-nowrap overflow-hidden text-ellipsis leading-snug ${className}`}
        aria-describedby={open ? tooltipId : undefined}
        title={isTruncated ? undefined : title}
      >
        {title}
      </span>

      {open && isTruncated && typeof document !== "undefined"
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="fixed z-[70] max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 pointer-events-none"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translateX(-100%)",
                maxWidth: "min(20rem, calc(100vw - 2rem))",
              }}
            >
              <p className="whitespace-pre-wrap break-words">{title}</p>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
