"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PresenceUser } from "@/lib/types";
import { usePresence } from "@/hooks/usePresence";

const HOVER_TOOLTIP_DELAY_MS = 1000;
const HIDE_TOOLTIP_DELAY_MS = 1000;
const TOOLTIP_FADE_MS = 300;
const SELF_ARROW_GAP_PX = 2;
const SELF_ARROW_TOP_OFFSET_PX = 23;
const SELF_ARROW_WIDTH = 96;
const SELF_ARROW_HEIGHT = 72;

function getAvatarKey(user: PresenceUser): string {
  return `${user.avatarResourceId}-${user.nameResourceId}-${user.isSelf ? "self" : "other"}`;
}

type PresenceAvatarProps = {
  user: PresenceUser;
  avatarKey: string;
  pinnedKey: string | null;
  onPinToggle: (avatarKey: string) => void;
  onClearPinned: () => void;
};

function PresenceAvatar({
  user,
  avatarKey,
  pinnedKey,
  onPinToggle,
  onClearPinned,
}: PresenceAvatarProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const fadeInFrameRef = useRef<number | null>(null);
  const fadeOutTimerRef = useRef<number | null>(null);
  const arrowFadeInFrameRef = useRef<number | null>(null);
  const arrowFadeOutTimerRef = useRef<number | null>(null);
  const [hoverVisible, setHoverVisible] = useState(false);
  const [tooltipPresent, setTooltipPresent] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [arrowPresent, setArrowPresent] = useState(false);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [arrowPos, setArrowPos] = useState({ top: 0, left: 0 });
  const pinned = pinnedKey === avatarKey;
  const showTooltip = pinned || hoverVisible;
  const showSelfArrow = user.isSelf && pinned;
  const tooltipId = `presence-tooltip-${avatarKey}`;

  const updateTooltipPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    setTooltipPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const updateArrowPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    setArrowPos({
      top: rect.top + SELF_ARROW_TOP_OFFSET_PX,
      left: rect.right + SELF_ARROW_GAP_PX,
    });
  }, []);

  const updateOverlayPositions = useCallback(() => {
    updateTooltipPosition();
    updateArrowPosition();
  }, [updateArrowPosition, updateTooltipPosition]);

  const clearArrowFadeTimers = useCallback(() => {
    if (arrowFadeInFrameRef.current !== null) {
      cancelAnimationFrame(arrowFadeInFrameRef.current);
      arrowFadeInFrameRef.current = null;
    }

    if (arrowFadeOutTimerRef.current !== null) {
      window.clearTimeout(arrowFadeOutTimerRef.current);
      arrowFadeOutTimerRef.current = null;
    }
  }, []);

  const clearFadeTimers = useCallback(() => {
    if (fadeInFrameRef.current !== null) {
      cancelAnimationFrame(fadeInFrameRef.current);
      fadeInFrameRef.current = null;
    }

    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
  }, []);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearShowTimer();
    clearHideTimer();
    clearFadeTimers();
    clearArrowFadeTimers();
  }, [clearArrowFadeTimers, clearFadeTimers, clearHideTimer, clearShowTimer]);

  const scheduleHideTooltip = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setHoverVisible(false);
      if (pinnedKey === avatarKey) {
        onClearPinned();
      }
      hideTimerRef.current = null;
    }, HIDE_TOOLTIP_DELAY_MS);
  }, [avatarKey, clearHideTimer, onClearPinned, pinnedKey]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    if (pinnedKey !== null && pinnedKey !== avatarKey) {
      clearAllTimers();
      setHoverVisible(false);
    }
  }, [avatarKey, clearAllTimers, pinnedKey]);

  useEffect(() => {
    if (showTooltip) {
      clearFadeTimers();
      setTooltipPresent(true);
      fadeInFrameRef.current = requestAnimationFrame(() => {
        fadeInFrameRef.current = requestAnimationFrame(() => {
          setTooltipVisible(true);
          fadeInFrameRef.current = null;
        });
      });
      return clearFadeTimers;
    }

    setTooltipVisible(false);
    fadeOutTimerRef.current = window.setTimeout(() => {
      setTooltipPresent(false);
      fadeOutTimerRef.current = null;
    }, TOOLTIP_FADE_MS);

    return clearFadeTimers;
  }, [clearFadeTimers, showTooltip]);

  useEffect(() => {
    if (showSelfArrow) {
      clearArrowFadeTimers();
      setArrowPresent(true);
      arrowFadeInFrameRef.current = requestAnimationFrame(() => {
        arrowFadeInFrameRef.current = requestAnimationFrame(() => {
          setArrowVisible(true);
          arrowFadeInFrameRef.current = null;
        });
      });
      return clearArrowFadeTimers;
    }

    setArrowVisible(false);
    arrowFadeOutTimerRef.current = window.setTimeout(() => {
      setArrowPresent(false);
      arrowFadeOutTimerRef.current = null;
    }, TOOLTIP_FADE_MS);

    return clearArrowFadeTimers;
  }, [clearArrowFadeTimers, showSelfArrow]);

  useEffect(() => {
    if (!tooltipPresent && !arrowPresent) {
      return;
    }

    updateOverlayPositions();

    const handleReposition = () => {
      updateOverlayPositions();
    };

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [arrowPresent, tooltipPresent, updateOverlayPositions]);

  const handleMouseEnter = () => {
    clearHideTimer();

    if (showTooltip) {
      return;
    }

    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      updateOverlayPositions();
      setHoverVisible(true);
      if (pinnedKey !== null && pinnedKey !== avatarKey) {
        onClearPinned();
      }
      showTimerRef.current = null;
    }, HOVER_TOOLTIP_DELAY_MS);
  };

  const handleMouseLeave = () => {
    clearShowTimer();

    if (showTooltip) {
      scheduleHideTooltip();
    }
  };

  const handleClick = () => {
    clearAllTimers();
    setHoverVisible(false);
    onPinToggle(avatarKey);
    if (pinnedKey !== avatarKey) {
      updateOverlayPositions();
    }
  };

  return (
    <>
      <div className="relative shrink-0 py-1 px-0.5 ps-2">
        <button
          ref={buttonRef}
          type="button"
          aria-label={user.nameLabel}
          aria-describedby={tooltipPresent ? tooltipId : undefined}
          className={`rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${
            user.isSelf
              ? "p-0.5 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 shadow-md shadow-indigo-200/60 dark:shadow-none"
              : "p-px ring-1 ring-slate-200 dark:ring-slate-600"
          }`}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
            <Image
              src={user.avatarPath}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
        </button>
      </div>

      {tooltipPresent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: "translateX(-50%)",
              zIndex: 9999,
              transition: `opacity ${TOOLTIP_FADE_MS}ms ease`,
              opacity: tooltipVisible ? 1 : 0,
            }}
            className="pointer-events-none whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-slate-700"
          >
            {user.nameLabel}
          </div>,
          document.body
        )}

      {arrowPresent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: arrowPos.top,
              left: arrowPos.left,
              zIndex: 9998,
              transition: `opacity ${TOOLTIP_FADE_MS}ms ease`,
              opacity: arrowVisible ? 1 : 0,
            }}
            className="pointer-events-none"
          >
            <Image
              src="/avatars/arrow.png"
              alt="זה את/ה"
              width={SELF_ARROW_WIDTH}
              height={SELF_ARROW_HEIGHT}
              className="h-auto w-[96px]"
              priority
            />
          </div>,
          document.body
        )}
    </>
  );
}

export default function OnlineUsers() {
  const { visibleUsers, loading } = usePresence();
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);

  const handlePinToggle = useCallback((avatarKey: string) => {
    setPinnedKey((current) => (current === avatarKey ? null : avatarKey));
  }, []);

  const handleClearPinned = useCallback(() => {
    setPinnedKey(null);
  }, []);

  if (loading || visibleUsers.length === 0) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="flex flex-row items-center gap-2 overflow-x-auto overflow-y-visible min-w-0 flex-1 max-w-[420px] py-0.5 ps-3 pe-2 -translate-x-1"
    >
      {visibleUsers.map((user) => {
        const avatarKey = getAvatarKey(user);

        return (
          <PresenceAvatar
            key={avatarKey}
            user={user}
            avatarKey={avatarKey}
            pinnedKey={pinnedKey}
            onPinToggle={handlePinToggle}
            onClearPinned={handleClearPinned}
          />
        );
      })}
    </div>
  );
}
