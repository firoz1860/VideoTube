import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import VideoCard from '../../components/video/VideoCard';
import FilterBar, { type FeedFilter } from '../../components/video/FilterBar';

const VideoCardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3">
    <div className="skeleton aspect-video w-full" />
    <div className="flex gap-3">
      <div className="skeleton w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  </div>
);

const Home: React.FC = () => {
  const { videos, isLoading } = useData();
  const [filter, setFilter] = useState<FeedFilter>('all');

  // Client-side sorts over the already-loaded feed — no extra requests.
  const displayed = useMemo(() => {
    const list = [...videos];
    switch (filter) {
      case 'trending':
        return list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      case 'liked':
        return list.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
      case 'recent':
        return list.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      default:
        return list; // 'all' keeps the feed's default (recency) order
    }
  }, [videos, filter]);

  return (
    <div className="container mx-auto px-2 sm:px-4">
      {/* Sticky filter bar — leads the feed, YouTube-style */}
      <div
        className="sticky top-0 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 py-3 mb-5 border-b border-slate-800/60"
        style={{ background: 'rgb(var(--app-bg))' }}
      >
        <FilterBar active={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg font-medium mb-1">No videos yet</p>
          <p className="text-slate-500 text-sm">Upload a video to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {displayed.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
