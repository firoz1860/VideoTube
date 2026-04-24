import { Link } from 'react-router-dom';
import type { Video } from '../../types';
import { useData } from '../../context/DataContext';
import Avatar from '../common/Avatar';
import { formatNumber, formatTimeAgo } from '../../utils/formatter';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const { subscriptions, toggleSubscription, addToHistory } = useData();
  const isSubscribed = subscriptions.includes(video.channel.id);

  const handleVideoClick = () => {
    void addToHistory(video.id);
  };

  const handleSubscribe = async () => {
    await toggleSubscription(video.channel.id);
  };

  return (
    <div className="group flex flex-col">
      {/* Thumbnail */}
      <Link
        to={`/video/${video.id}`}
        className="block rounded-xl overflow-hidden aspect-video relative bg-slate-800 mb-3"
        onClick={handleVideoClick}
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="video-thumbnail w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
            No thumbnail
          </div>
        )}

        {/* Duration badge */}
        <span className="duration-badge">{video.duration}</span>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200">
            <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Meta */}
      <div className="flex gap-3 flex-1">
        <Link to={`/channel/${video.channel.id}`} className="shrink-0 mt-0.5">
          <Avatar src={video.channel.avatar} alt={video.channel.name} />
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/video/${video.id}`} onClick={handleVideoClick}>
            <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2 hover:text-purple-400 transition-colors duration-150">
              {video.title}
            </h3>
          </Link>

          <Link to={`/channel/${video.channel.id}`}>
            <p className="text-slate-400 text-xs mb-0.5 hover:text-slate-200 transition-colors duration-150 truncate">
              {video.channel.name}
            </p>
          </Link>

          <p className="text-slate-500 text-xs">
            {formatNumber(video.views)} views &middot; {formatTimeAgo(video.timestamp)}
          </p>

          {/* Subscribe – visible on hover */}
          <button
            type="button"
            onClick={() => void handleSubscribe()}
            className={`mt-2 text-xs px-3 py-1 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 ${
              isSubscribed
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
