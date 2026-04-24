import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { mapPlaylist, mapUser } from '../../lib/mappers';
import ChannelHeader from '../../components/channel/ChannelHeader';
import ChannelTabs from '../../components/channel/ChannelTabs';
import { formatTimeAgo } from '../../utils/formatter';
import type { Playlist, User } from '../../types';

const ChannelPlaylist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    void Promise.all([api.getChannelById(id), api.getUserPlaylists(id)])
      .then(([channelResponse, playlistsResponse]) => {
        setChannel(mapUser(channelResponse));
        setPlaylists(playlistsResponse.map(mapPlaylist));
      })
      .catch(() => {
        setChannel(null);
        setPlaylists([]);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading playlists...</div>;
  }

  if (!channel) {
    return <div className="container mx-auto px-4 py-10 text-center">Channel not found.</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <ChannelHeader channel={channel} />
      <ChannelTabs activeTab="playlists" channelId={channel.id} />

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {playlists.map((playlist) => (
            <Link key={playlist.id} to={`/channel/${channel.id}/playlist/${playlist.id}`} className="bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-700 transition-colors">
              <div className="relative aspect-video bg-slate-900">
                {playlist.thumbnail ? (
                  <img src={playlist.thumbnail} alt={playlist.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No thumbnail</div>
                )}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded">{playlist.videoCount} videos</div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">{playlist.title}</h3>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{playlist.description}</p>
                <p className="text-gray-400 text-sm">Updated {formatTimeAgo(playlist.timestamp)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-medium mb-2">No playlists created</h2>
          <p className="text-gray-400 text-center">There are no playlists created on this channel.</p>
        </div>
      )}
    </div>
  );
};

export default ChannelPlaylist;
