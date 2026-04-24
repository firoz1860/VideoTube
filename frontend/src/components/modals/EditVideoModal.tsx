import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

interface EditVideoModalProps {
  video: {
    title: string;
    description: string;
    thumbnail: string;
  };
  onClose: () => void;
  onSave: (data: { title: string; description: string; thumbnail: string | File }) => void;
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({ video, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
  });
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      thumbnail: newThumbnail || formData.thumbnail,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail</label>
              <div className="relative aspect-video mb-2">
                <img
                  src={newThumbnail ? URL.createObjectURL(newThumbnail) : formData.thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setNewThumbnail(file);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title*</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVideoModal;