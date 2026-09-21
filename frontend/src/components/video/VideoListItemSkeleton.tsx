import React from 'react';

// Matches the VideoListItem layout so lists don't flash an empty state while
// the feed is still loading.
const VideoListItemSkeleton: React.FC = () => (
  <div className="flex gap-4 p-3">
    <div className="skeleton w-44 sm:w-52 aspect-video rounded-xl shrink-0" />
    <div className="flex-1 min-w-0 space-y-2.5 pt-1">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-3 w-2/3 hidden sm:block" />
    </div>
  </div>
);

export default VideoListItemSkeleton;
