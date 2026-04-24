import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

interface UploadVideoModalProps {
  onClose: () => void;
  onUpload: (data: FormData) => Promise<void>;
}

const UploadVideoModal: React.FC<UploadVideoModalProps> = ({ onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title.trim() || !thumbnail) return;

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('thumbnail', thumbnail);

    setIsUploading(true);
    try {
      await onUpload(formData);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upload Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 mb-4 text-center"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {videoFile ? (
              <div className="text-center">
                <p className="text-green-500 mb-2">Video selected</p>
                <p className="text-gray-400">{videoFile.name}</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-purple-500 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg mb-2">Drag and drop video files to upload</p>
                <p className="text-gray-400 text-sm mb-4">Your video will stay private until you publish it.</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail*</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setThumbnail(file);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title*</label>
              <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!videoFile || !thumbnail || !title.trim() || isUploading}>
              {isUploading ? 'Uploading...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideoModal;
