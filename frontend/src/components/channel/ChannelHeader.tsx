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
    <div className="mb-6">
      {/* Banner */}
      <div
        className="h-32 sm:h-44 rounded-xl bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${channel.coverImage || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1260&h=400&dpr=1'})`,
        }}
      />

      {/* Info row — avatar overlaps the banner, text sits below on the page */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 px-2 sm:px-4 -mt-10 sm:-mt-12">
        <Avatar
          src={channel.avatar}
          alt={channel.name}
          className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-[#0F1729] shadow-lg shrink-0"
        />

        <div className="flex-1 text-center sm:text-left pb-1">
          <h1 className="text-2xl font-bold">{channel.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            <span>@{channel.username}</span>
            <span className="mx-1.5">·</span>
            <span>{formatNumber(channel.subscribers || 0)} subscribers</span>
            {typeof channel.subscribedToCount === 'number' && (
              <>
                <span className="mx-1.5">·</span>
                <span>{formatNumber(channel.subscribedToCount)} subscriptions</span>
              </>
            )}
          </p>
        </div>

        {!isOwnChannel && (
          <Button variant={isSubscribed ? 'secondary' : 'primary'} className="px-8 shrink-0" onClick={() => void toggleSubscription(channel.id)}>
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChannelHeader;
