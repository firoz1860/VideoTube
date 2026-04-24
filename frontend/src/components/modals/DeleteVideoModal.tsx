import React from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';

interface DeleteVideoModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteVideoModal: React.FC<DeleteVideoModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Delete Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          Are you sure you want to delete this video? Once deleted, you will not be able to recover it.
        </p>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteVideoModal;