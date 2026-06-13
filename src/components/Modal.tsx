import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

const Modal = ({ title, onClose, children, wide }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col min-w-0 my-4`}>
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-900 truncate">{title}</h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 overflow-x-hidden">{children}</div>
    </div>
  </div>
);

export default Modal;
