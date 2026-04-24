import React from 'react';
import { useData } from '../../context/DataContext';
import VideoListItem from '../../components/video/VideoListItem';
import { Clock, Trash2, X } from 'lucide-react';
import Button from '../../components/common/Button';

const History: React.FC = () => {
  const { videos, watchHistory, removeFromHistory, clearHistory } = useData();
  const historyVideos = videos
    .filter((video) => watchHistory.includes(video.id))
    .sort((a, b) => watchHistory.indexOf(a.id) - watchHistory.indexOf(b.id));

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-purple-500" />
          <h1 className="text-2xl font-bold">Watch History</h1>
          <span className="bg-slate-700 px-2 py-1 rounded text-sm">{historyVideos.length}</span>
        </div>
        {historyVideos.length > 0 && (
          <Button variant="secondary" size="sm" icon={<Trash2 size={16} />} onClick={() => void clearHistory()}>
            Clear History
          </Button>
        )}
      </div>

      {historyVideos.length > 0 ? (
        <div className="space-y-4">
          {historyVideos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoListItem video={video} />
              <button
                onClick={() => void removeFromHistory(video.id)}
                className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from history"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-slate-800 rounded-full p-4 mb-4">
            <Clock className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium mb-2">No watch history</h2>
          <p className="text-gray-400 text-center">Videos you watch will appear here</p>
        </div>
      )}
    </div>
  );
};

export default History;
