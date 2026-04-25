import { Link } from 'react-router-dom';
import type { Video } from '../../types';
import { useData } from '../../context/DataContext';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { formatNumber, formatTimeAgo } from '../../utils/formatter';

interface VideoListItemProps {
  video: Video;
}

const VideoListItem: React.FC<VideoListItemProps> = ({ video }) => {
  const { subscriptions, toggleSubscription, addToHistory } = useData();
  const isSubscribed = subscriptions.includes(video.channel.id);

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSubscription(video.channel.id);
  };

  return (
    <div className="flex gap-4 p-3 rounded-xl transition-all hover:bg-slate-800/70 group">
      {/* Thumbnail */}
      <Link
        to={`/video/${video.id}`}
        onClick={() => void addToHistory(video.id)}
        className="flex-shrink-0"
      >
        <div className="relative rounded-xl overflow-hidden w-44 sm:w-52 aspect-video bg-slate-800">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Duration badge — always white text on dark bg */}
          {video.duration && (
            <span
              className="absolute bottom-1.5 right-1.5 text-white text-xs font-semibold px-1.5 py-0.5 rounded-md leading-none"
              style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
            >
              {video.duration}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Link to={`/video/${video.id}`} onClick={() => void addToHistory(video.id)}>
          <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 hover:text-purple-400 transition-colors">
            {video.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-1.5">
          <Link to={`/channel/${video.channel.id}`} className="flex items-center gap-2 min-w-0">
            <Avatar src={video.channel.avatar} size="sm" />
            <span className="text-gray-400 text-sm hover:text-white transition-colors truncate">
              {video.channel.name}
            </span>
          </Link>

          <Button
            variant={isSubscribed ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleSubscribe}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>

        <p className="text-gray-400 text-xs sm:text-sm">
          {formatNumber(video.views)} views · {formatTimeAgo(video.timestamp)}
        </p>

        {video.description && (
          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 hidden sm:block">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoListItem;
