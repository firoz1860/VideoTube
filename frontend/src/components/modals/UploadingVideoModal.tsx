import React from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';

interface UploadingVideoModalProps {
  fileName: string;
  progress: number;
  onCancel: () => void;
}

const UploadingVideoModal: React.FC<UploadingVideoModalProps> = ({
  fileName,
  progress,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Uploading Video...</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-slate-700 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm mb-1">{fileName}</p>
              <div className="text-xs text-gray-400">{Math.round(progress)}%</div>
            </div>
          </div>

          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled>
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadingVideoModal;