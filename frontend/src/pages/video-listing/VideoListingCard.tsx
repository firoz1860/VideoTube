import React from 'react';
import { useData } from '../../context/DataContext';
import VideoCard from '../../components/video/VideoCard';

const VideoListingCard: React.FC = () => {
  const { videos } = useData();

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trending Videos</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoListingCard;
