import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { mapUser } from '../../lib/mappers';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ChannelHeader from '../../components/channel/ChannelHeader';
import ChannelTabs from '../../components/channel/ChannelTabs';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { formatNumber } from '../../utils/formatter';
import type { User } from '../../types';

const ChannelSubscribed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { subscriptions, toggleSubscription } = useData();
  const [channel, setChannel] = useState<User | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    void Promise.all([api.getChannelById(id), api.getSubscribedChannels(id)])
      .then(([channelResponse, subscribedResponse]) => {
        setChannel(mapUser(channelResponse));
        setSubscribedChannels(subscribedResponse.map(mapUser));
      })
      .catch(() => {
        setChannel(null);
        setSubscribedChannels([]);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading subscriptions...</div>;
  }

  if (!channel) {
    return <div className="container mx-auto px-4 py-10 text-center">Channel not found.</div>;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4">
      <ChannelHeader channel={channel} />
      <ChannelTabs activeTab="subscribed" channelId={channel.id} />

      <div className="mt-6">
        {subscribedChannels.length > 0 ? (
          <div className="space-y-4">
            {subscribedChannels.map((subscribedChannel) => (
              <div key={subscribedChannel.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar src={subscribedChannel.avatar} alt={subscribedChannel.name} className="w-12 h-12" />
                  <div className="min-w-0">
                    <h3 className="font-medium">{subscribedChannel.name}</h3>
                    <p className="text-gray-400 text-sm">{formatNumber(subscribedChannel.subscribers || 0)} subscribers</p>
                  </div>
                </div>

                <Button
                  variant={!isAuthenticated || subscriptions.includes(subscribedChannel.id) ? "secondary" : "primary"}
                  size="sm"
                  onClick={isAuthenticated ? () => void toggleSubscription(subscribedChannel.id) : undefined}
                  className="w-full sm:w-auto"
                >
                  {isAuthenticated
                    ? subscriptions.includes(subscribedChannel.id)
                      ? "Subscribed"
                      : "Subscribe"
                    : "Subscribed"}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <h2 className="text-xl font-medium mb-2">No subscribed channels</h2>
            <p className="text-gray-400 text-center">This channel is not following any other channels yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSubscribed;
