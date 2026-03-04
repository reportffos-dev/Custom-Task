
import React from 'react';
// Corrected import to match existing types in types.ts
import { ImageFile } from '../types';

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove }) => {
  const isProcessing = image.status === 'processing';
  const isCompleted = image.status === 'completed';
  const isError = image.status === 'error';

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Before/After Overlay toggle could go here, for now side-by-side or swap */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {isCompleted && image.resultUrl ? (
          <img 
            src={image.resultUrl} 
            alt="Result" 
            className="w-full h-full object-cover animate-fade-in" 
          />
        ) : (
          <img 
            // Corrected property name from originalPreview to preview
            src={image.preview} 
            alt="Original" 
            className={`w-full h-full object-cover transition-opacity duration-300 ${isProcessing ? 'opacity-40 grayscale' : 'opacity-100'}`} 
          />
        )}

        {/* Status Overlays */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-bold text-gray-800 uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Processing</p>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 text-red-600 p-4 text-center">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p className="text-xs font-semibold">{image.error || 'Failed to process'}</p>
          </div>
        )}

        {/* Action buttons (only on hover or completed) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onRemove(image.id)}
            className="bg-white/90 hover:bg-red-500 hover:text-white p-2 rounded-full shadow-sm text-gray-600 transition-all"
            title="Remove image"
          >
            <i className="fas fa-trash-alt text-xs"></i>
          </button>
        </div>

        {isCompleted && (
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <a 
              href={image.resultUrl} 
              download={`lifestyle-${image.id}.png`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center space-x-1"
            >
              <i className="fas fa-download"></i>
              <span>Save</span>
            </a>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter w-2/3">
            {/* Corrected property name from originalFile to file */}
            {image.file.name}
          </span>
          {isCompleted && (
            <span className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-tighter">
              <i className="fas fa-check-circle mr-1"></i> Success
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
