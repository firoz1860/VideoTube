import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Repeat2, Heart } from 'lucide-react';
import { api } from '../../lib/api';
import { mapTweet, mapUser } from '../../lib/mappers';
import ChannelHeader from '../../components/channel/ChannelHeader';
import ChannelTabs from '../../components/channel/ChannelTabs';
import Avatar from '../../components/common/Avatar';
import { formatTimeAgo } from '../../utils/formatter';
import type { Tweet, User } from '../../types';

const ChannelTweets: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<User | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    void Promise.all([api.getChannelById(id), api.getUserTweets(id)])
      .then(([channelResponse, tweetsResponse]) => {
        setChannel(mapUser(channelResponse));
        setTweets(tweetsResponse.map(mapTweet));
      })
      .catch(() => {
        setChannel(null);
        setTweets([]);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">Loading tweets...</div>;
  }

  if (!channel) {
    return <div className="container mx-auto px-4 py-10 text-center">Channel not found.</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <ChannelHeader channel={channel} />
      <ChannelTabs activeTab="tweets" channelId={channel.id} />

      <div className="mt-6 space-y-4">
        {tweets.length > 0 ? (
          tweets.map((tweet) => (
            <div key={tweet.id} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar src={tweet.user.avatar} alt={tweet.user.name} className="w-10 h-10" />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{tweet.user.name}</span>
                    <span className="text-gray-400">@{tweet.user.username}</span>
                    <span className="text-gray-400">.</span>
                    <span className="text-gray-400">{formatTimeAgo(tweet.timestamp)}</span>
                  </div>

                  <p className="text-gray-200 mb-3">{tweet.text}</p>

                  <div className="flex items-center gap-6 text-gray-400">
                    <button className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                      <MessageSquare size={18} />
                      <span>Reply</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                      <Repeat2 size={18} />
                      <span>{tweet.retweets}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                      <Heart size={18} />
                      <span>{tweet.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-slate-800 rounded-full p-4 mb-4">
              <MessageSquare className="w-12 h-12 text-gray-500" />
            </div>
            <h2 className="text-xl font-medium mb-2">No tweets</h2>
            <p className="text-gray-400 text-center">This channel has not posted any tweets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelTweets;
