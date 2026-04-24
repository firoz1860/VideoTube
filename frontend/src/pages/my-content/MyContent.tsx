import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import UploadVideoModal from '../../components/modals/UploadVideoModal';
import EditVideoModal from '../../components/modals/EditVideoModal';
import DeleteVideoModal from '../../components/modals/DeleteVideoModal';
import UploadingVideoModal from '../../components/modals/UploadingVideoModal';
import UploadSuccessModal from '../../components/modals/UploadSuccessModal';
import { Video, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { formatNumber } from '../../utils/formatter';
import type { Video as VideoType } from '../../types';

interface EditableVideoPayload {
  title: string;
  description?: string;
  thumbnail: string | File;
}

const MyContent: React.FC = () => {
  const { user } = useAuth();
  const { videos, addVideo, updateVideo, deleteVideo } = useData();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadingModal, setShowUploadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');

  const myVideos = useMemo(
    () => videos.filter((video) => video.channel.id === user?.id),
    [videos, user?.id]
  );

  const handleUpload = async (formData: FormData) => {
    const file = formData.get('videoFile') as File | null;
    setUploadFileName(file?.name || 'video');
    setShowUploadModal(false);
    setShowUploadingModal(true);
    setUploadProgress(20);

    try {
      await addVideo(formData);
      setUploadProgress(100);
      setShowSuccessModal(true);
    } finally {
      setShowUploadingModal(false);
    }
  };

  const handleEdit = (video: VideoType) => {
    setSelectedVideo(video);
    setShowEditModal(true);
  };

  const handleDelete = (video: VideoType) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedVideo) return;

    await deleteVideo(selectedVideo.id);
    setShowDeleteModal(false);
    setSelectedVideo(null);
  };

  const handleSaveEdit = async (data: EditableVideoPayload) => {
    if (!selectedVideo) return;

    await updateVideo(selectedVideo.id, {
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
    });
    setShowEditModal(false);
    setSelectedVideo(null);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-purple-500" />
          <h1 className="text-2xl font-bold">My Content</h1>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowUploadModal(true)}>
          Upload Video
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Total Videos</h3>
          <p className="text-2xl font-bold">{myVideos.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Total Views</h3>
          <p className="text-2xl font-bold">{formatNumber(myVideos.reduce((sum, video) => sum + video.views, 0))}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-gray-400 mb-2">Total Subscribers</h3>
          <p className="text-2xl font-bold">{formatNumber(user?.subscribers || 0)}</p>
        </div>
      </div>

      {myVideos.length > 0 ? (
        <div className="space-y-4">
          {myVideos.map((video) => (
            <div key={video.id} className="bg-slate-800 rounded-lg p-4 flex flex-col sm:flex-row gap-4">
              <img src={video.thumbnail} alt={video.title} className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-1">{video.title}</h3>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{video.description}</p>
                <p className="text-gray-400 text-sm">
                  {formatNumber(video.views)} views • {new Date(video.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end sm:justify-start">
                <button
                  onClick={() => window.open(`/video/${video.id}`, '_blank')}
                  className="p-2 hover:bg-slate-700 rounded"
                  title="View Video"
                >
                  <Eye size={16} />
                </button>
                <button onClick={() => handleEdit(video)} className="p-2 hover:bg-slate-700 rounded" title="Edit Video">
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(video)}
                  className="p-2 hover:bg-slate-700 rounded text-red-400"
                  title="Delete Video"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-slate-800 rounded-full p-4 mb-4">
            <Video className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium mb-2">No videos uploaded</h2>
          <p className="text-gray-400 text-center mb-4">Start sharing your story with the world</p>
          <Button icon={<Plus size={16} />} onClick={() => setShowUploadModal(true)}>
            Upload Your First Video
          </Button>
        </div>
      )}

      {showUploadModal && <UploadVideoModal onClose={() => setShowUploadModal(false)} onUpload={handleUpload} />}
      {showEditModal && selectedVideo && (
        <EditVideoModal video={selectedVideo} onClose={() => setShowEditModal(false)} onSave={(data) => void handleSaveEdit(data)} />
      )}
      {showDeleteModal && <DeleteVideoModal onClose={() => setShowDeleteModal(false)} onConfirm={() => void confirmDelete()} />}
      {showUploadingModal && (
        <UploadingVideoModal fileName={uploadFileName} progress={uploadProgress} onCancel={() => setShowUploadingModal(false)} />
      )}
      {showSuccessModal && (
        <UploadSuccessModal
          fileName={uploadFileName}
          onClose={() => setShowSuccessModal(false)}
          onFinish={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default MyContent;

