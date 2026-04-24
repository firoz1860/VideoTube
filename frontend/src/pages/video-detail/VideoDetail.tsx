import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, ChevronDown, ChevronUp, X, Check, BookmarkCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { mapComment, mapVideo } from '../../lib/mappers';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import CommentItem from '../../components/comment/CommentItem';
import { formatNumber, formatTimeAgo } from '../../utils/formatter';
import type { Comment, Video } from '../../types';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  'Sexual content',
  'Violent or repulsive content',
  'Hateful or abusive content',
  'Harassment or bullying',
  'Harmful or dangerous acts',
  'Misinformation',
  'Child abuse',
  'Spam or misleading',
  'Other',
];

const VideoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { videos, addToHistory, toggleLike, likedVideos, subscriptions, toggleSubscription, collections, addVideoToCollection, removeVideoFromCollection } = useData();

  const [video, setVideo] = useState<Video | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [flagSubmitted, setFlagSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const relatedVideos = useMemo(
    () => videos.filter((item) => item.id !== id).slice(0, 8),
    [videos, id]
  );

  useEffect(() => {
    if (!id) return;

    window.scrollTo(0, 0);
    setIsLoadingVideo(true);
    setVideo(null);
    setComments([]);

    void Promise.all([api.getVideo(id), api.getVideoComments(id)])
      .then(([videoResponse, commentResponse]) => {
        setVideo(mapVideo(videoResponse));
        setComments((commentResponse.items || []).map(mapComment));
      })
      .catch(() => {
        const fallbackVideo = videos.find((item) => item.id === id) || null;
        setVideo(fallbackVideo);
        setComments([]);
      })
      .finally(() => setIsLoadingVideo(false));

    void addToHistory(id);
  }, [id]);

  if (isLoadingVideo) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3 space-y-4">
            <div className="aspect-video bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-8 bg-slate-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
          </div>
          <div className="lg:w-1/3 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="w-40 aspect-video bg-slate-800 rounded animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return <div className="text-center py-12 text-gray-400">Video not found</div>;
  }

  const isLiked = likedVideos.includes(video.id);
  const isSubscribed = subscriptions.includes(video.channel.id);
  const videoUrl = window.location.href;

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to like videos');
      return;
    }
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount((c) => Math.max(0, c - 1));
    }
    await toggleLike(video.id);
    setVideo((current) =>
      current
        ? {
            ...current,
            likeCount: isLiked ? Math.max((current.likeCount || 1) - 1, 0) : (current.likeCount || 0) + 1,
          }
        : current
    );
  };

  const handleDislike = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to dislike videos');
      return;
    }
    if (isLiked) {
      void toggleLike(video.id);
      setVideo((current) =>
        current ? { ...current, likeCount: Math.max((current.likeCount || 1) - 1, 0) } : current
      );
    }
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount((c) => Math.max(0, c - 1));
    } else {
      setIsDisliked(true);
      setDislikeCount((c) => c + 1);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to subscribe');
      return;
    }
    await toggleSubscription(video.channel.id);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    if (!isAuthenticated) {
      toast.error('Sign in to comment');
      return;
    }
    setIsSubmittingComment(true);
    try {
      const response = await api.createComment(id, newComment.trim());
      setComments((current) => [mapComment(response), ...current]);
      setNewComment('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((current) => current.filter((c) => c.id !== commentId));
  };

  const handleUpdateComment = (commentId: string, newText: string) => {
    setComments((current) =>
      current.map((c) => (c.id === commentId ? { ...c, text: newText } : c))
    );
  };

  const handleSaveToCollection = async (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    const isSaved = collection.videos.includes(video.id);
    try {
      if (isSaved) {
        await removeVideoFromCollection(collectionId, video.id);
        toast.success('Removed from collection');
      } else {
        await addVideoToCollection(collectionId, video.id);
        toast.success('Saved to collection');
      }
    } catch {
      toast.error('Failed to update collection');
    }
  };

  const handleFlagSubmit = () => {
    if (!selectedReason) return;
    setFlagSubmitted(true);
    setTimeout(() => {
      setShowFlagModal(false);
      setFlagSubmitted(false);
      setSelectedReason('');
      toast.success('Report submitted. Thank you for your feedback.');
    }, 1500);
  };

  const isSavedInAny = collections.some((c) => c.videos.includes(video.id));

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="lg:w-2/3">
          {/* Video player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {video.videoUrl ? (
              <video
                controls
                poster={video.thumbnail}
                className="w-full h-full"
                src={video.videoUrl}
                key={video.id}
              />
            ) : (
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold mb-3">{video.title}</h1>

          {/* Channel + actions */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-3">
              <Link to={`/channel/${video.channel.id}`}>
                <Avatar src={video.channel.avatar} alt={video.channel.name} size="lg" />
              </Link>
              <div>
                <Link to={`/channel/${video.channel.id}`} className="font-semibold hover:text-purple-400 transition-colors">
                  {video.channel.name}
                </Link>
                <p className="text-gray-400 text-sm">{formatNumber(video.channel.subscribers || 0)} subscribers</p>
              </div>

              <Button
                variant={isSubscribed ? 'secondary' : 'primary'}
                onClick={() => void handleSubscribe()}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like */}
              <button
                onClick={() => void handleLike()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isLiked
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                }`}
              >
                <ThumbsUp size={15} className={isLiked ? 'fill-white' : ''} />
                <span>{formatNumber(video.likeCount || 0)}</span>
              </button>

              {/* Dislike */}
              <button
                onClick={handleDislike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isDisliked
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                }`}
              >
                <ThumbsDown size={15} className={isDisliked ? 'fill-white' : ''} />
                {dislikeCount > 0 && <span>{formatNumber(dislikeCount)}</span>}
              </button>

              {/* Share */}
              <button
                onClick={() => void handleShare()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-700 hover:bg-slate-600 text-gray-200 transition-all"
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>

              {/* Save */}
              <button
                onClick={() => {
                  if (!isAuthenticated) { toast.error('Sign in to save videos'); return; }
                  setShowSaveModal(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSavedInAny
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                }`}
              >
                {isSavedInAny ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                <span>Save</span>
              </button>

              {/* Report */}
              <button
                onClick={() => {
                  if (!isAuthenticated) { toast.error('Sign in to report videos'); return; }
                  setShowFlagModal(true);
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm font-medium bg-slate-700 hover:bg-red-900/40 hover:text-red-400 text-gray-400 transition-all"
                title="Report"
              >
                <Flag size={15} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-gray-400 text-sm mb-2">
              <span>{formatNumber(video.views)} views</span>
              <span>&middot;</span>
              <span>{formatTimeAgo(video.timestamp)}</span>
            </div>
            {video.description && (
              <>
                <p className={`text-sm text-gray-300 whitespace-pre-wrap ${showDescription ? '' : 'line-clamp-2'}`}>
                  {video.description}
                </p>
                {video.description.length > 100 && (
                  <button
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mt-2"
                    onClick={() => setShowDescription((v) => !v)}
                  >
                    {showDescription ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-lg font-bold mb-4">{comments.length} Comments</h3>

            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex gap-3">
                  <Avatar src={user?.avatar} alt={user?.name || 'You'} />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-600 focus:border-purple-500 focus:outline-none py-2 text-sm"
                    />
                    {newComment.trim() && (
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setNewComment('')}
                          className="px-3 py-1.5 rounded-full text-sm text-gray-400 hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingComment}
                          className="px-4 py-1.5 rounded-full text-sm bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? 'Posting...' : 'Comment'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-slate-800 rounded-lg text-center text-sm text-gray-400">
                <Link to="/login" className="text-purple-400 hover:underline">Sign in</Link> to leave a comment
              </div>
            )}

            <div>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  onDelete={handleDeleteComment}
                  onUpdate={handleUpdateComment}
                />
              ))}
              {comments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:w-1/3">
          <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wide">Up Next</h2>
          <div className="space-y-3">
            {relatedVideos.map((relatedVideo) => (
              <Link key={relatedVideo.id} to={`/video/${relatedVideo.id}`} className="flex gap-2 group">
                <div className="relative rounded overflow-hidden w-40 flex-shrink-0 bg-slate-800">
                  <img
                    src={relatedVideo.thumbnail}
                    alt={relatedVideo.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                    {relatedVideo.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {relatedVideo.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-0.5">{relatedVideo.channel.name}</p>
                  <p className="text-gray-500 text-xs">
                    {formatNumber(relatedVideo.views)} views &middot; {formatTimeAgo(relatedVideo.timestamp)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Share</h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-3">Share this video</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={videoUrl}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
              />
              <button
                onClick={() => void handleCopyLink()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  copied ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {copied ? <><Check size={14} className="inline mr-1" />Copied</> : 'Copy'}
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg bg-[#1DA1F2] text-white text-sm text-center font-medium hover:bg-[#1a8cd8] transition-colors"
              >
                Twitter/X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg bg-[#1877F2] text-white text-sm text-center font-medium hover:bg-[#166fe5] transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${video.title} ${videoUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-lg bg-[#25D366] text-white text-sm text-center font-medium hover:bg-[#20bd5a] transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Save to Collection Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSaveModal(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Save to collection</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            {collections.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-3">No collections yet.</p>
                <Link
                  to="/collections"
                  onClick={() => setShowSaveModal(false)}
                  className="text-purple-400 hover:underline text-sm"
                >
                  Create a collection
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {collections.map((collection) => {
                  const isSaved = collection.videos.includes(video.id);
                  return (
                    <button
                      key={collection.id}
                      onClick={() => void handleSaveToCollection(collection.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSaved ? 'bg-purple-600 border-purple-600' : 'border-gray-500'
                      }`}>
                        {isSaved && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{collection.name}</p>
                        <p className="text-gray-400 text-xs">{collection.videos.length} videos</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flag/Report Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowFlagModal(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Report video</h2>
              <button onClick={() => setShowFlagModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            {flagSubmitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={24} className="text-green-400" />
                </div>
                <p className="font-medium">Report submitted</p>
                <p className="text-gray-400 text-sm mt-1">Thank you for helping keep our community safe.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-3">Why are you reporting this video?</p>
                <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedReason === reason
                          ? 'bg-purple-600/20 border border-purple-500 text-purple-300'
                          : 'hover:bg-slate-700 border border-transparent text-gray-300'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFlagModal(false)}
                    className="flex-1 py-2 rounded-lg border border-slate-600 text-sm text-gray-400 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlagSubmit}
                    disabled={!selectedReason}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDetail;
