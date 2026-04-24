import React from 'react';
import { Link } from 'react-router-dom';

interface ChannelTabsProps {
  activeTab: string;
  channelId: string;
}

const ChannelTabs: React.FC<ChannelTabsProps> = ({ activeTab, channelId }) => {
  const tabs = [
    { id: 'videos', label: 'Videos', path: `/channel/${channelId}` },
    { id: 'playlists', label: 'Playlists', path: `/channel/${channelId}/playlists` },
    { id: 'tweets', label: 'Tweets', path: `/channel/${channelId}/tweets` },
    { id: 'subscribed', label: 'Subscribed', path: `/channel/${channelId}/subscribed` }
  ];

  return (
    <div className="border-b border-slate-700">
      <div className="flex">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            to={tab.path}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChannelTabs;