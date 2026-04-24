import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { mapPlaylist, mapUser } from '../../lib/mappers';
import ChannelHeader from '../../components/channel/ChannelHeader';
import ChannelTabs from '../../components/channel/ChannelTabs';
import VideoListItem from '../../components/video/VideoListItem';
import type { Playlist, User } from '../../types';

const ChannelPlaylistVideos: React.FC = () => {
  const { id, playlistId } = useParams<{ id: string; playlistId: string }>();
  const [channel, setChannel] = useState<User | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !playlistId) return;

    setIsLoading(true);
    void Promise.all([api.getChannelById(id), api.getPlaylist(playlistId)])
      .then(([channelResponse, playlistResponse]) => {
        setChannel(mapUser(channelResponse));
        setPlaylist(mapPlaylist(playlistResponse));
      })
      .catch(() => {
        setChannel(null);
        setPlaylist(null);
      })
      .finally(() => setIsLoading(false));
  }, [id, playlistId]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading playlist...</div>;
  }

  if (!channel || !playlist) {
    return <div className="container mx-auto px-4 py-10 text-center">Playlist not found.</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <ChannelHeader channel={channel} />
      <ChannelTabs activeTab="playlists" channelId={channel.id} />

      <div className="mt-6">
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold mb-2">{playlist.title}</h2>
          <p className="text-gray-400">{playlist.description}</p>
        </div>

        <div className="space-y-4">
          {(playlist.videos || []).map((video) => (
            <VideoListItem key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelPlaylistVideos;
