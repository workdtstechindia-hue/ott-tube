import {
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

const Dropdown = memo(function Dropdown({
  value,
  options = [],
  onChange,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || options[0],
    [options, value]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const onOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [isOpen]);

  const chooseOption = useCallback(
    (optionValue) => {
      onChange?.(optionValue);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const onButtonKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
      }
    },
    []
  );

  const onMenuKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        chooseOption(options[highlightedIndex].value);
      }
    },
    [chooseOption, highlightedIndex, options]
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() =>
          setIsOpen((prev) => {
            const next = !prev;
            if (next) {
              const index = options.findIndex((option) => option.value === value);
              setHighlightedIndex(index >= 0 ? index : 0);
            }
            return next;
          })
        }
        onKeyDown={onButtonKeyDown}
        className="glass-surface flex h-11 min-w-44 items-center justify-between rounded-xl px-3 text-sm text-[var(--text-primary)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-[var(--text-muted)] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        role="listbox"
        tabIndex={-1}
        onKeyDown={onMenuKeyDown}
        className={`glass-surface absolute right-0 z-50 mt-2 w-full origin-top rounded-xl p-1.5 shadow-xl transition-all duration-150 ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          const highlighted = index === highlightedIndex;
          return (
            <button
              key={option.value}
              type="button"
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => chooseOption(option.value)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                highlighted
                  ? "bg-white/10 text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{option.label}</span>
              {selected ? <CheckIcon className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Dropdown;
