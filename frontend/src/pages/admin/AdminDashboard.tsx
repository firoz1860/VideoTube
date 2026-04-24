import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { Eye, Edit2, Trash2 } from 'lucide-react';

interface VideoStats {
  id: string;
  title: string;
  status: 'published' | 'unpublished';
  likes: number;
  dislikes: number;
  dateUploaded: string;
  thumbnail: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const stats = {
    totalViews: '221,234',
    totalSubscribers: '4,053',
    totalLikes: '63,021'
  };

  const videos: VideoStats[] = [
    {
      id: '1',
      title: 'JavaScript Fundamentals: Variables and Data Types',
      status: 'published',
      likes: 73,
      dislikes: 2,
      dateUploaded: '9/22/2023',
      thumbnail: 'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg'
    },
    {
      id: '2',
      title: 'React Hooks Explained: useState and useEffect',
      status: 'unpublished',
      likes: 245,
      dislikes: 8,
      dateUploaded: '9/21/2023',
      thumbnail: 'https://images.pexels.com/photos/3184454/pexels-photo-3184454.jpeg'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome Back, {user?.name}</h1>
          <p className="text-gray-400">Overview • Video Management • Channel Metrics</p>
        </div>
        <Button>+ Upload video</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Total views</h3>
          <p className="text-2xl font-bold">{stats.totalViews}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Total subscribers</h3>
          <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Total likes</h3>
          <p className="text-2xl font-bold">{stats.totalLikes}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Uploaded</th>
              <th className="text-left p-4">Rating</th>
              <th className="text-left p-4">Date uploaded</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-slate-700">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      video.status === 'published' ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <span className="capitalize">{video.status}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <span className="font-medium">{video.title}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">+{video.likes}</span>
                    <span className="text-red-500">-{video.dislikes}</span>
                  </div>
                </td>
                <td className="p-4">{video.dateUploaded}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-slate-700 rounded">
                      <Eye size={16} />
                    </button>
                    <button className="p-1 hover:bg-slate-700 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1 hover:bg-slate-700 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;