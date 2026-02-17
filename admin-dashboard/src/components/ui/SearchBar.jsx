import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { memo, useCallback, useEffect, useState } from "react";
import useDebounce from "../../hooks/useDebounce";

const SearchBar = memo(function SearchBar({
  value = "",
  onSearch,
  placeholder = "Search...",
  showClear = true,
}) {
  const [draftValue, setDraftValue] = useState(value);
  const debouncedValue = useDebounce(draftValue, 300);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue.trim());
    }
  }, [debouncedValue, onSearch]);

  const triggerSearch = useCallback(() => {
    onSearch?.(draftValue.trim());
  }, [draftValue, onSearch]);

  const clearSearch = useCallback(() => {
    setDraftValue("");
    onSearch?.("");
  }, [onSearch]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        triggerSearch();
      }
    },
    [triggerSearch]
  );

  return (
    <div className="glass-surface flex h-11 w-full items-center rounded-xl sm:max-w-md">
      <input
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-full flex-1 bg-transparent px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
      />
      <div className="flex h-full items-center gap-1 pr-1.5">
        {showClear && draftValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={triggerSearch}
          className="grid h-8 w-8 place-items-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

export default SearchBar;
