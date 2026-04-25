import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

interface EditVideoModalProps {
  video: { title: string; description?: string; thumbnail: string };
  onClose: () => void;
  onSave: (data: { title: string; description: string; thumbnail: string | File }) => void;
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({ video, onClose, onSave }) => {
  const [title, setTitle]           = useState(video.title);
  const [description, setDescription] = useState(video.description ?? '');
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [isSaving, setIsSaving]     = useState(false);

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setNewThumbnail(f);
  };

  return (
    /*
     * Backdrop: flex column so the panel never grows wider than the viewport.
     * overflow-y-auto on backdrop handles overscroll on very small screens.
     */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/*
       * Panel: flex-col with explicit max-height so it NEVER exceeds the viewport.
       * Header and Footer are flex-shrink-0 (always visible).
       * Body is flex-1 + overflow-y-auto (scrolls when content is tall).
       */}
      <div
        className="w-full max-w-xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxHeight: 'min(90vh, 660px)',
          background: 'rgb(17 24 39)',
          border: '1px solid rgba(51,65,85,0.55)',
          animation: 'modalSlideUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Edit Video</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your video details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Thumbnail */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-wider">
                Thumbnail
              </label>

              {/* Preview — capped height */}
              <div
                className="relative rounded-xl overflow-hidden bg-black group cursor-pointer mb-2.5"
                style={{ height: 'clamp(120px, 25vw, 200px)' }}
              >
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                {/* hover overlay */}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={20} className="text-white mb-1" />
                  <span className="text-white text-xs font-semibold">Click to change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>
              </div>

              {/* File name / click-to-pick (mobile friendly) */}
              <label className="inline-flex items-center gap-1.5 text-xs text-purple-400 cursor-pointer hover:text-purple-300 transition-colors">
                <Upload size={12} />
                {newThumbnail ? newThumbnail.name : 'Choose new thumbnail…'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">
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
              <label className="block text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video…"
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 resize-none transition-all"
              />
            </div>
          </div>

          {/* ── Footer — always visible at the bottom ── */}
          <div
            className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0 border-t border-slate-700/60"
            style={{ background: 'rgb(17 24 39)' }}
          >
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
