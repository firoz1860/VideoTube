import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { mapUser } from '../../lib/mappers';
import { useData } from '../../context/DataContext';
import ChannelHeader from '../../components/channel/ChannelHeader';
import ChannelTabs from '../../components/channel/ChannelTabs';
import VideoCard from '../../components/video/VideoCard';
import type { User } from '../../types';

const ChannelVideoList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { videos } = useData();
  const [channel, setChannel] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    void api.getChannelById(id)
      .then((response) => setChannel(mapUser(response)))
      .catch(() => setChannel(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const channelVideos = useMemo(() => videos.filter((video) => video.channel.id === id), [videos, id]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading channel...</div>;
  }

  if (!channel) {
    return <div className="container mx-auto px-4 py-10 text-center">Channel not found.</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <ChannelHeader channel={channel} />
      <ChannelTabs activeTab="videos" channelId={channel.id} />

      {channelVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {channelVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-slate-800 rounded-full p-4 mb-4">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">No videos uploaded</h2>
          <p className="text-gray-400 text-center">This channel has not uploaded any videos yet.</p>
        </div>
      )}
    </div>
  );
};

export default ChannelVideoList;
