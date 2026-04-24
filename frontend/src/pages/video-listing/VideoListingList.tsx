import React from 'react';
import { useData } from '../../context/DataContext';
import VideoListItem from '../../components/video/VideoListItem';

const VideoListingList: React.FC = () => {
  const { videos } = useData();

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trending Videos</h1>
      </div>

      <div className="space-y-4">
        {videos.map((video) => (
          <VideoListItem key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoListingList;
