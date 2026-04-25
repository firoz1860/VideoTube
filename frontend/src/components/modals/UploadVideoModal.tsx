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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxHeight: 'min(92vh, 680px)', background: 'rgb(22 32 50)', border: '1px solid rgba(51,65,85,0.55)' }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Upload Video</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center"
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
              <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Thumbnail *</label>
              <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setThumbnail(f); }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Title *</label>
              <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/70 resize-none transition-all"
                rows={3} />
            </div>
          </div>
          </div>{/* end scrollable body */}

          {/* Footer — always visible */}
          <div className="flex justify-end gap-3 px-5 py-4 flex-shrink-0 border-t border-slate-700/60" style={{ background: 'rgb(22 32 50)' }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!videoFile || !thumbnail || !title.trim() || isUploading}>
              {isUploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideoModal;
