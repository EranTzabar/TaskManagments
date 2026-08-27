"use client";

interface SubtaskToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
}

export default function SubtaskToggleButton({ expanded, onClick }: SubtaskToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={expanded ? "הסתר תת-משימות" : "הצג תת-משימות"}
      aria-expanded={expanded}
      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition shrink-0"
    >
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
