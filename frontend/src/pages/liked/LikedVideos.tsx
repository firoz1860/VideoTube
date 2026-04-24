import React from 'react';
import { useData } from '../../context/DataContext';
import VideoListItem from '../../components/video/VideoListItem';
import { Heart, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

const LikedVideos: React.FC = () => {
  const { videos, likedVideos, toggleLike } = useData();
  const likedVideoList = videos.filter((video) => likedVideos.includes(video.id));

  const clearAllLiked = async () => {
    await Promise.all(likedVideoList.map((video) => toggleLike(video.id)));
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold">Liked Videos</h1>
          <span className="bg-slate-700 px-2 py-1 rounded text-sm">{likedVideoList.length}</span>
        </div>
        {likedVideoList.length > 0 && (
          <Button variant="secondary" size="sm" icon={<Trash2 size={16} />} onClick={() => void clearAllLiked()}>
            Clear All
          </Button>
        )}
      </div>

      {likedVideoList.length > 0 ? (
        <div className="space-y-4">
          {likedVideoList.map((video) => (
            <div key={video.id} className="relative group">
              <VideoListItem video={video} />
              <button
                onClick={() => void toggleLike(video.id)}
                className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from liked videos"
              >
                <Heart size={16} className="fill-current" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-slate-800 rounded-full p-4 mb-4">
            <Heart className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium mb-2">No liked videos</h2>
          <p className="text-gray-400 text-center">Videos you like will appear here</p>
        </div>
      )}
    </div>
  );
};

export default LikedVideos;
