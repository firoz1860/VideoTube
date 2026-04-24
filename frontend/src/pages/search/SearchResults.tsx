import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import Avatar from '../../components/common/Avatar';
import VideoListItem from '../../components/video/VideoListItem';
import { formatNumber } from '../../utils/formatter';
import type { User } from '../../types';

type SearchTab = 'all' | 'videos' | 'channels';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { videos, users, subscriptions, toggleSubscription } = useData();
  const [activeTab, setActiveTab] = useState<SearchTab>('all');

  useEffect(() => {
    setActiveTab('all');
  }, [query]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredVideos = useMemo(
    () =>
      normalizedQuery
        ? videos.filter((video) =>
            [video.title, video.description, video.channel.name, video.channel.username]
              .filter(Boolean)
              .some((value) => value!.toLowerCase().includes(normalizedQuery))
          )
        : [],
    [normalizedQuery, videos]
  );

  const filteredChannels = useMemo<User[]>(
    () =>
      normalizedQuery
        ? users.filter((channel) =>
            [channel.name, channel.username].some((value) => value.toLowerCase().includes(normalizedQuery))
          )
        : [],
    [normalizedQuery, users]
  );

  const tabs = [
    { id: 'all', label: 'All', count: filteredVideos.length + filteredChannels.length },
    { id: 'videos', label: 'Videos', count: filteredVideos.length },
    { id: 'channels', label: 'Channels', count: filteredChannels.length },
  ];

  const renderChannels = (channels: User[]) => (
    <div className="space-y-4">
      {channels.map((channel) => (
        <div key={channel.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
          <Avatar src={channel.avatar} alt={channel.name} className="w-16 h-16" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg">{channel.name}</h3>
            <p className="text-gray-400">@{channel.username}</p>
            <p className="text-gray-400 text-sm">{formatNumber(channel.subscribers || 0)} subscribers</p>
          </div>
          <button
            onClick={() => void toggleSubscription(channel.id)}
            className={`px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
              subscriptions.includes(channel.id)
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {subscriptions.includes(channel.id) ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      ))}
    </div>
  );

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Search VidTube</h1>
          <p className="text-gray-400">Enter a search term to find videos and channels</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search results for "{query}"</h1>
        <p className="text-gray-400">{filteredVideos.length + filteredChannels.length} results found</p>
      </div>

      <div className="border-b border-slate-700 mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SearchTab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="space-y-8">
          {filteredChannels.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Channels</h2>
              {renderChannels(filteredChannels.slice(0, 3))}
            </div>
          )}
          {filteredVideos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Videos</h2>
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <VideoListItem key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <VideoListItem key={video.id} video={video} />
          ))}
        </div>
      )}

      {activeTab === 'channels' && renderChannels(filteredChannels)}

      {filteredVideos.length === 0 && filteredChannels.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No results found</h2>
          <p className="text-gray-400">Try different keywords or check your spelling</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
