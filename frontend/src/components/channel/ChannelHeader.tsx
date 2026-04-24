import React from 'react';
import type { User } from '../../types';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { formatNumber } from '../../utils/formatter';
import { useData } from '../../context/DataContext';

interface ChannelHeaderProps {
  channel: User;
  isOwnChannel?: boolean;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel, isOwnChannel = false }) => {
  const { subscriptions, toggleSubscription } = useData();
  const isSubscribed = subscriptions.includes(channel.id);

  return (
    <div className="relative mb-6">
      <div
        className="h-40 rounded-lg bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${channel.coverImage || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1260&h=400&dpr=1'})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 px-4 relative z-10">
        <Avatar src={channel.avatar} alt={channel.name} className="w-24 h-24 border-4 border-[#0F1729] shadow-lg" />

        <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0 pb-4">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">{channel.name}</h1>
          <p className="text-gray-200 text-sm drop-shadow">@{channel.username}</p>
          <p className="text-gray-200 text-sm drop-shadow">
            {formatNumber(channel.subscribers || 0)} subscribers
            {typeof channel.subscribedToCount === 'number' ? ` • ${formatNumber(channel.subscribedToCount)} subscriptions` : ''}
          </p>
        </div>

        {!isOwnChannel && (
          <Button variant={isSubscribed ? 'secondary' : 'primary'} className="px-8" onClick={() => void toggleSubscription(channel.id)}>
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChannelHeader;
