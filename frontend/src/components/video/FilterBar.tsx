import React from 'react';

export type FeedFilter = 'all' | 'trending' | 'liked' | 'recent';

interface FilterBarProps {
  active: FeedFilter;
  onChange: (id: FeedFilter) => void;
}

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'liked', label: 'Most liked' },
  { id: 'recent', label: 'Recently added' },
];

const FilterBar: React.FC<FilterBarProps> = ({ active, onChange }) => (
  <div
    className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden"
    style={{ scrollbarWidth: 'none' }}
    role="tablist"
    aria-label="Filter videos"
  >
    {FILTERS.map(({ id, label }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(id)}
          className="shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
          style={
            isActive
              ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' }
              : { background: 'rgba(100,116,139,0.16)', color: 'rgb(var(--app-text))' }
          }
        >
          {label}
        </button>
      );
    })}
  </div>
);

export default FilterBar;
