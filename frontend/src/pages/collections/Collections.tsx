import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderHeart, Plus, Play, Trash2, Pencil, X, ArrowLeft, FolderOpen } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { formatTimeAgo, formatNumber } from '../../utils/formatter';
import type { Collection } from '../../types';
import toast from 'react-hot-toast';

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; collection: Collection }
  | { type: 'delete'; collection: Collection };

const Collections: React.FC = () => {
  const { collections, addCollection, updateCollection, deleteCollection, removeVideoFromCollection, videos } = useData();

  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);

  const videosById = useMemo(() => new Map(videos.map((v) => [v.id, v])), [videos]);

  const openCreate = () => {
    setFormData({ name: '', description: '' });
    setModal({ type: 'create' });
  };

  const openEdit = (collection: Collection) => {
    setFormData({ name: collection.name, description: collection.description });
    setModal({ type: 'edit', collection });
  };

  const closeModal = () => {
    setModal({ type: 'none' });
    setFormData({ name: '', description: '' });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      await addCollection({
        name: formData.name.trim(),
        description: formData.description.trim(),
        videos: [],
        thumbnail: '',
        createdAt: new Date().toISOString(),
      });
      toast.success('Collection created');
      closeModal();
    } catch {
      toast.error('Failed to create collection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (modal.type !== 'edit' || !formData.name.trim()) return;
    setIsSaving(true);
    try {
      await updateCollection(modal.collection.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      if (viewingCollection?.id === modal.collection.id) {
        setViewingCollection((c) => c ? { ...c, name: formData.name.trim(), description: formData.description.trim() } : c);
      }
      toast.success('Collection updated');
      closeModal();
    } catch {
      toast.error('Failed to update collection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (collection: Collection) => {
    try {
      await deleteCollection(collection.id);
      if (viewingCollection?.id === collection.id) setViewingCollection(null);
      toast.success('Collection deleted');
    } catch {
      toast.error('Failed to delete collection');
    }
    closeModal();
  };

  const handleRemoveVideo = async (collectionId: string, videoId: string) => {
    try {
      await removeVideoFromCollection(collectionId, videoId);
      setViewingCollection((c) => c ? { ...c, videos: c.videos.filter((id) => id !== videoId) } : c);
      toast.success('Video removed from collection');
    } catch {
      toast.error('Failed to remove video');
    }
  };

  // Collection detail view
  if (viewingCollection) {
    const collection = collections.find((c) => c.id === viewingCollection.id) || viewingCollection;
    const collectionVideos = collection.videos.map((id) => videosById.get(id)).filter(Boolean);

    return (
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setViewingCollection(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Collections</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
          <div className="w-full sm:w-56 aspect-video bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
            {collection.thumbnail ? (
              <img src={collection.thumbnail} alt={collection.name} className="w-full h-full object-cover" />
            ) : collectionVideos[0]?.thumbnail ? (
              <img src={collectionVideos[0].thumbnail} alt={collection.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <FolderOpen size={40} />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{collection.name}</h1>
            {collection.description && (
              <p className="text-gray-400 text-sm mb-3">{collection.description}</p>
            )}
            <p className="text-gray-500 text-sm mb-4">{collection.videos.length} videos &middot; Created {formatTimeAgo(collection.createdAt)}</p>
            <div className="flex gap-3">
              {collectionVideos.length > 0 && (
                <Link
                  to={`/video/${collectionVideos[0]!.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-full text-sm font-medium transition-colors"
                >
                  <Play size={16} /> Play all
                </Link>
              )}
              <button
                onClick={() => openEdit(collection)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-full text-sm font-medium transition-colors"
              >
                <Pencil size={15} /> Edit
              </button>
              <button
                onClick={() => setModal({ type: 'delete', collection })}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-900/40 hover:text-red-400 rounded-full text-sm font-medium transition-colors text-gray-300"
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>

        {collectionVideos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No videos in this collection</p>
            <p className="text-sm mt-1">Save videos to this collection from any video page</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collectionVideos.map((video, index) => (
              <div key={video!.id} className="flex gap-3 items-center p-3 rounded-lg hover:bg-slate-800/50 group transition-colors">
                <span className="text-gray-600 text-sm w-5 text-center flex-shrink-0">{index + 1}</span>
                <Link to={`/video/${video!.id}`} className="flex gap-3 flex-1 min-w-0">
                  <div className="relative w-36 flex-shrink-0 rounded overflow-hidden">
                    <img src={video!.thumbnail} alt={video!.title} className="w-full aspect-video object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {video!.duration}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">{video!.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{video!.channel.name}</p>
                    <p className="text-gray-500 text-xs">{formatNumber(video!.views)} views</p>
                  </div>
                </Link>
                <button
                  onClick={() => void handleRemoveVideo(collection.id, video!.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-slate-700 text-gray-400 hover:text-red-400 transition-all flex-shrink-0"
                  title="Remove from collection"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit modal for detail view */}
        {modal.type === 'edit' && renderFormModal()}
        {modal.type === 'delete' && modal.collection && renderDeleteModal(modal.collection)}
      </div>
    );
  }

  function renderFormModal() {
    const isEdit = modal.type === 'edit';
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeModal}>
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold">{isEdit ? 'Edit Collection' : 'Create New Collection'}</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name <span className="text-red-400">*</span></label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                placeholder="Collection name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
                placeholder="Describe your collection (optional)"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={closeModal} disabled={isSaving}>Cancel</Button>
            <Button
              onClick={() => void (isEdit ? handleEdit() : handleCreate())}
              disabled={!formData.name.trim() || isSaving}
            >
              {isSaving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save changes' : 'Create')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderDeleteModal(collection: Collection) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeModal}>
        <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold mb-2">Delete collection?</h2>
          <p className="text-gray-400 text-sm mb-6">
            "{collection.name}" will be permanently deleted. Videos in this collection won't be deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <button
              onClick={() => void handleDelete(collection)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderHeart className="w-6 h-6 text-purple-500" />
          <h1 className="text-2xl font-bold">Collections</h1>
          <span className="bg-slate-700 px-2 py-0.5 rounded-full text-sm text-gray-300">{collections.length}</span>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          Create Collection
        </Button>
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => {
            const collectionVideos = collection.videos.map((id) => videosById.get(id)).filter(Boolean);
            const thumbnailSrc = collection.thumbnail || collectionVideos[0]?.thumbnail || '';

            return (
              <div key={collection.id} className="bg-slate-800 rounded-xl overflow-hidden group hover:bg-slate-750 transition-colors">
                <button
                  className="relative aspect-video bg-slate-900 w-full overflow-hidden"
                  onClick={() => setViewingCollection(collection)}
                >
                  {thumbnailSrc ? (
                    <img src={thumbnailSrc} alt={collection.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <FolderOpen size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
                      <Play size={16} fill="white" /> Open
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded-full">
                    {collection.videos.length} videos
                  </div>
                </button>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setViewingCollection(collection)}
                      className="font-semibold text-left hover:text-purple-400 transition-colors line-clamp-1 flex-1"
                    >
                      {collection.name}
                    </button>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(collection)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', collection })}
                        className="p-1.5 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {collection.description && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{collection.description}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-2">Created {formatTimeAgo(collection.createdAt)}</p>

                  {collectionVideos.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {collectionVideos.slice(0, 4).map((video) => (
                        <img
                          key={video!.id}
                          src={video!.thumbnail}
                          alt={video!.title}
                          className="w-10 h-7 object-cover rounded"
                        />
                      ))}
                      {collectionVideos.length > 4 && (
                        <div className="w-10 h-7 rounded bg-slate-700 flex items-center justify-center text-xs text-gray-400">
                          +{collectionVideos.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-slate-800 rounded-full p-5 mb-4">
            <FolderHeart className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No collections yet</h2>
          <p className="text-gray-400 text-sm text-center mb-6 max-w-sm">
            Organize your favorite videos into collections. Save videos directly from any video page.
          </p>
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Create Your First Collection
          </Button>
        </div>
      )}

      {modal.type === 'create' && renderFormModal()}
      {modal.type === 'edit' && renderFormModal()}
      {modal.type === 'delete' && renderDeleteModal(modal.collection)}
    </div>
  );
};

export default Collections;
