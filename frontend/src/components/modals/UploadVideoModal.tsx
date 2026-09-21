import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, Film, Image as ImageIcon, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import Button from '../common/Button';

interface UploadVideoModalProps {
  onClose: () => void;
  onUpload: (data: FormData) => Promise<void>;
}

const MAX_VIDEO_MB = 100; // Cloudinary free-tier single-file video limit
const MAX_IMAGE_MB = 8;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadVideoModal: React.FC<UploadVideoModalProps> = ({ onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Manage the thumbnail preview object URL lifecycle.
  useEffect(() => {
    if (!thumbnail) {
      setThumbnailPreview('');
      return;
    }
    const url = URL.createObjectURL(thumbnail);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  const applyVideoFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('That file is not a video. Please choose an MP4, WebM or MOV file.');
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Video is too large (${formatBytes(file.size)}). The limit is ${MAX_VIDEO_MB} MB.`);
      return;
    }
    setError('');
    setVideoFile(file);
  };

  const applyThumbnail = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('The thumbnail must be an image (JPG, PNG or WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Thumbnail is too large (${formatBytes(file.size)}). The limit is ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setError('');
    setThumbnail(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    applyVideoFile(e.dataTransfer.files?.[0]);
  };

  const canSubmit = Boolean(videoFile && thumbnail && title.trim()) && !isUploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) { setError('Please select a video file to upload.'); return; }
    if (!thumbnail) { setError('Please add a thumbnail image.'); return; }
    if (!title.trim()) { setError('Please give your video a title.'); return; }

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('thumbnail', thumbnail);

    setError('');
    setIsUploading(true);
    try {
      await onUpload(formData);
      // On success the parent closes this modal; keep inputs intact otherwise.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const surface = 'rgb(22 32 50)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isUploading) onClose(); }}
    >
      <div
        className="w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxHeight: 'min(92vh, 720px)', background: surface, border: '1px solid rgba(51,65,85,0.55)', animation: 'modalSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)' }}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Upload video</h2>
              <p className="text-purple-200 text-xs mt-0.5">Share your content with the community</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5' }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Video dropzone */}
            {videoFile ? (
              <div className="flex items-center gap-3 rounded-xl p-4"
                style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.35)' }}>
                <span className="w-11 h-11 rounded-lg bg-purple-600/25 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-purple-300" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{videoFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(videoFile.size)} · ready to upload</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = ''; }}
                  disabled={isUploading}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  aria-label="Remove video"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className="w-full rounded-xl px-6 py-10 text-center transition-all"
                style={{
                  border: `2px dashed ${isDragging ? '#7c3aed' : 'rgba(100,116,139,0.5)'}`,
                  background: isDragging ? 'rgba(124,58,237,0.08)' : 'transparent',
                }}
              >
                <span className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                  <Upload className="w-6 h-6 text-white" />
                </span>
                <p className="text-sm font-semibold text-white">
                  {isDragging ? 'Drop your video here' : 'Drag & drop a video, or click to browse'}
                </p>
                <p className="text-slate-400 text-xs mt-1.5">MP4, WebM or MOV · up to {MAX_VIDEO_MB} MB</p>
              </button>
            )}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
              onChange={(e) => applyVideoFile(e.target.files?.[0])} />

            {/* Thumbnail */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-wider">
                Thumbnail <span className="text-purple-400">*</span>
              </label>
              {thumbnailPreview ? (
                <div className="relative rounded-xl overflow-hidden aspect-video max-w-xs"
                  style={{ border: '1px solid rgba(51,65,85,0.6)' }}>
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <Button type="button" size="sm" variant="secondary" onClick={() => thumbInputRef.current?.click()}>
                      Replace
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setThumbnail(null); if (thumbInputRef.current) thumbInputRef.current.value = ''; }}
                      className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      aria-label="Remove thumbnail"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="w-full rounded-xl px-4 py-6 flex flex-col items-center gap-2 transition-colors hover:bg-slate-800/60"
                  style={{ border: '2px dashed rgba(100,116,139,0.5)' }}
                >
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                  <span className="text-sm text-slate-300">Add a thumbnail image</span>
                  <span className="text-xs text-slate-500">JPG, PNG or WebP · up to {MAX_IMAGE_MB} MB</span>
                </button>
              )}
              <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => applyThumbnail(e.target.files?.[0])} />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-wider">
                Title <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a title"
                maxLength={120}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/70 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1 text-right">{title.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-wider">
                Description <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video…"
                rows={3}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/70 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 flex-shrink-0 border-t border-slate-700/60" style={{ background: surface }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>
              {isUploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : 'Upload video'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideoModal;
