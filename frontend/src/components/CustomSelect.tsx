"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
  "aria-label"?: string;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  size = "default",
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = options.findIndex((o) => o.value === value);
      const next = options[Math.min(idx + 1, options.length - 1)];
      if (next) onChange(next.value);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = options.findIndex((o) => o.value === value);
      const prev = options[Math.max(idx - 1, 0)];
      if (prev) onChange(prev.value);
    }
  };

  const paddingClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-50 border rounded-lg font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all cursor-pointer ${paddingClass} ${
          open ? "border-zinc-300 ring-2 ring-zinc-900" : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <span className={selected ? "text-zinc-900" : "text-zinc-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1.5 w-full min-w-max bg-white border border-zinc-200 rounded-xl shadow-lg shadow-zinc-200/60 py-1.5 overflow-hidden"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-zinc-50 text-zinc-900 font-semibold"
                    : "text-zinc-700 hover:bg-zinc-50 font-medium"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
