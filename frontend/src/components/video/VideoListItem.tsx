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

  const handleVideoClick = () => {
    void addToHistory(video.id);
  };

  return (
    <div className="flex gap-4 mb-4 hover:bg-slate-800 p-2 rounded-lg transition-colors group">
      <Link to={`/video/${video.id}`} className="flex-shrink-0" onClick={handleVideoClick}>
        <div className="relative rounded-lg overflow-hidden w-48 aspect-video bg-slate-800">
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
            {video.duration}
          </span>
        </div>
      </Link>

      <div className="flex-1">
        <Link to={`/video/${video.id}`} onClick={handleVideoClick}>
          <h3 className="font-medium mb-2 hover:text-purple-400 transition-colors">{video.title}</h3>
        </Link>

        <div className="flex items-center justify-between mb-2">
          <Link to={`/channel/${video.channel.id}`} className="flex items-center gap-2">
            <Avatar src={video.channel.avatar} size="sm" />
            <span className="text-gray-400 text-sm hover:text-white transition-colors">{video.channel.name}</span>
          </Link>

          <Button
            variant={isSubscribed ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleSubscribe}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>

        <p className="text-gray-400 text-sm">
          {formatNumber(video.views)} views • {formatTimeAgo(video.timestamp)}
        </p>

        {video.description && <p className="text-gray-400 text-sm mt-2 line-clamp-2">{video.description}</p>}
      </div>
    </div>
  );
};

export default VideoListItem;
