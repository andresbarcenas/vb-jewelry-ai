"use client";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  summary?: string;
}

const fieldClasses =
  "w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters = [],
  summary,
}: FilterBarProps) {
  return (
    <div className="mb-5 rounded-[26px] border border-border/80 bg-white/72 p-4 shadow-[0_12px_32px_rgba(68,52,35,0.05)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(180px,0.6fr))]">
          {onSearchChange ? (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Search
              </span>
              <input
                className={fieldClasses}
                type="search"
                value={searchValue}
                placeholder={searchPlaceholder}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>
          ) : null}
          {filters.map((filter) => (
            <label className="block" key={filter.label}>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {filter.label}
              </span>
              <select
                className={fieldClasses}
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {summary ? (
          <p className="text-sm font-medium text-muted-foreground xl:pb-3">{summary}</p>
        ) : null}
      </div>
    </div>
  );
}
