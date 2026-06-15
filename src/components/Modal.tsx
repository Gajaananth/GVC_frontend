import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}

const Modal = ({ title, onClose, children, wide, className }: ModalProps) => (
  <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-2 md:p-4 bg-black/50 backdrop-blur-sm">
    <div className={`modal-content bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full ${wide ? 'sm:max-w-4xl md:max-w-5xl' : 'sm:max-w-2xl'} ${className ?? ''} max-h-[85vh] sm:max-h-[90vh] flex flex-col min-w-0 sm:my-4`}>
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 md:p-5 border-b border-gray-100 flex-shrink-0 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{title}</h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0 touch-target">
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
      <div className="p-3 sm:p-4 md:p-5 overflow-y-auto flex-1 overflow-x-hidden">{children}</div>
    </div>
  </div>
);

export default Modal;
