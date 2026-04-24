import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Users, Bell, BellOff } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { formatNumber } from '../../utils/formatter';
import Button from '../../components/common/Button';

const Subscribers: React.FC = () => {
  const { subscribedChannels, subscriptions, toggleSubscription } = useData();
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({});

  const toggleNotifications = (channelId: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  };

  return (
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <span className="bg-slate-700 px-2 py-1 rounded text-sm">{subscribedChannels.length}</span>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-2">Manage Subscriptions</h3>
        <p className="text-gray-400 text-sm">Get notified when your favorite channels upload new content</p>
      </div>

      {subscribedChannels.length > 0 ? (
        <div className="space-y-4">
          {subscribedChannels.map((channel) => (
            <div key={channel.id} className="bg-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar src={channel.avatar} alt={channel.name} className="w-16 h-16" />

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg">{channel.name}</h3>
                <p className="text-gray-400 text-sm">@{channel.username}</p>
                <p className="text-gray-400 text-sm">{formatNumber(channel.subscribers || 0)} subscribers</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => toggleNotifications(channel.id)}
                  className={`p-2 rounded-full transition-colors ${
                    notificationSettings[channel.id] ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {notificationSettings[channel.id] ? <Bell size={16} /> : <BellOff size={16} />}
                </button>

                <Button
                  variant={subscriptions.includes(channel.id) ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => void toggleSubscription(channel.id)}
                >
                  {subscriptions.includes(channel.id) ? 'Subscribed' : 'Subscribe'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-slate-800 rounded-full p-4 mb-4">
            <Users className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium mb-2">No subscriptions yet</h2>
          <p className="text-gray-400 text-center">Subscribe to channels to see their latest videos here</p>
        </div>
      )}
    </div>
  );
};

export default Subscribers;
