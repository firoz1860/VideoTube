import React from 'react';
import { Check, X } from 'lucide-react';
import Button from '../common/Button';

interface UploadSuccessModalProps {
  fileName: string;
  onClose: () => void;
  onFinish: () => void;
}

const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  fileName,
  onClose,
  onFinish,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Uploaded Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-slate-700 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm mb-1">{fileName}</p>
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <Check size={16} />
                <span>Uploaded Successfully</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onFinish}>
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadSuccessModal;