import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

interface EditVideoModalProps {
  video: {
    title: string;
    description?: string;
    thumbnail: string;
  };
  onClose: () => void;
  onSave: (data: { title: string; description: string; thumbnail: string | File }) => void;
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({ video, onClose, onSave }) => {
  const [title, setTitle]             = useState(video.title);
  const [description, setDescription] = useState(video.description ?? '');
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [isSaving, setIsSaving]       = useState(false);

  const previewUrl = newThumbnail ? URL.createObjectURL(newThumbnail) : video.thumbnail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      onSave({ title, description, thumbnail: newThumbnail ?? video.thumbnail });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    /* Backdrop — scrollable on small screens, centered on large */
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl my-4 sm:my-0 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'rgb(22 32 50)',
          border: '1px solid rgba(51,65,85,0.6)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold">Edit Video</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Thumbnail preview + upload */}
            <div>
              <label className="block text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wide">
                Thumbnail
              </label>

              {/* Preview — fixed height so it doesn't blow up on mobile */}
              <div className="relative rounded-xl overflow-hidden bg-black mb-3"
                style={{ height: 'clamp(140px, 30vw, 220px)' }}>
                <img
                  src={previewUrl}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                {/* Overlay hint */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={22} className="text-white mb-1" />
                  <span className="text-white text-xs font-medium">Click to change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setNewThumbnail(f);
                    }}
                  />
                </label>
              </div>

              {/* Explicit upload button for mobile */}
              <label className="flex items-center gap-2 text-xs text-purple-400 cursor-pointer w-fit hover:underline">
                <Upload size={13} />
                {newThumbnail ? newThumbnail.name : 'Choose new thumbnail…'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setNewThumbnail(f);
                  }}
                />
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-400 uppercase tracking-wide">
                Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-400 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video…"
                rows={4}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 resize-none transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/50">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Saving…</span>
                : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVideoModal;
