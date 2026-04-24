import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MoreVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { Comment } from '../../types';
import Avatar from '../common/Avatar';
import { formatTimeAgo, formatNumber } from '../../utils/formatter';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  onUpdate?: (commentId: string, newText: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, onDelete, onUpdate }) => {
  const { isAuthenticated } = useAuth();
  const { likedComments, toggleCommentLike } = useData();

  const [likeCount, setLikeCount] = useState(comment.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  const isLiked = likedComments.includes(comment.id);
  const isOwner = currentUserId && comment.user.id === currentUserId;

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to like comments');
      return;
    }
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount((c) => Math.max(0, c - 1));
    }
    try {
      const result = await toggleCommentLike(comment.id);
      setLikeCount(result.likeCount);
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleDislike = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to dislike comments');
      return;
    }
    if (isLiked) {
      void toggleCommentLike(comment.id);
      setLikeCount((c) => Math.max(0, c - 1));
    }
    if (isDisliked) {
      setIsDisliked(false);
      setDislikeCount((c) => Math.max(0, c - 1));
    } else {
      setIsDisliked(true);
      setDislikeCount((c) => c + 1);
    }
  };

  const handleEditSave = async () => {
    if (!editText.trim() || editText.trim() === comment.text) {
      setIsEditing(false);
      setEditText(comment.text);
      return;
    }
    setIsSavingEdit(true);
    try {
      await api.updateComment(comment.id, editText.trim());
      onUpdate?.(comment.id, editText.trim());
      setIsEditing(false);
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
      setEditText(comment.text);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    setIsDeleting(true);
    try {
      await api.deleteComment(comment.id);
      onDelete?.(comment.id);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
      setIsDeleting(false);
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText('');
    setShowReplyForm(false);
    toast('Replies coming soon!', { icon: '💬' });
  };

  if (isDeleting) return null;

  return (
    <div className="flex gap-3 py-4 border-b border-slate-700/50">
      <Avatar src={comment.user.avatar} alt={comment.user.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <span className="text-gray-500 text-xs">{formatTimeAgo(comment.timestamp)}</span>
          </div>

          {isOwner && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 min-w-32 overflow-hidden">
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete()}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-red-900/30 text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => { setIsEditing(false); setEditText(comment.text); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-400 hover:bg-slate-700"
                disabled={isSavingEdit}
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={() => void handleEditSave()}
                disabled={isSavingEdit || !editText.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} /> {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-300 mt-1 mb-2 break-words">{comment.text}</p>
        )}

        {!isEditing && (
          <div className="flex items-center gap-4 text-gray-500">
            <button
              onClick={() => void handleLike()}
              className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-purple-400' : 'hover:text-white'}`}
            >
              <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
              {likeCount > 0 && <span className="text-xs">{formatNumber(likeCount)}</span>}
            </button>

            <button
              onClick={handleDislike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${isDisliked ? 'text-red-400' : 'hover:text-white'}`}
            >
              <ThumbsDown size={14} className={isDisliked ? 'fill-current' : ''} />
              {dislikeCount > 0 && <span className="text-xs">{formatNumber(dislikeCount)}</span>}
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) { toast.error('Sign in to reply'); return; }
                setShowReplyForm((v) => !v);
              }}
              className="text-sm hover:text-white transition-colors"
            >
              Reply
            </button>
          </div>
        )}

        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder={`Reply to ${comment.user.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-transparent border-b border-gray-600 focus:border-purple-500 focus:outline-none py-1 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { setShowReplyForm(false); setReplyText(''); }}
              className="text-xs text-gray-400 hover:text-white px-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-500 disabled:opacity-50"
            >
              Reply
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
