import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiX, FiDownload, FiZoomIn, FiZoomOut,
  FiRotateCw, FiMaximize2, FiChevronLeft,
  FiChevronRight
} = FiIcons;

const FilePreview = ({ files = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!files || files.length === 0) return null;

  const currentFile = files[currentIndex];
  const isImage = currentFile?.type?.startsWith('image/');
  const isVideo = currentFile?.type?.startsWith('video/');

  const nextFile = () => {
    setCurrentIndex((prev) => (prev + 1) % files.length);
    setZoom(1);
    setRotation(0);
  };

  const prevFile = () => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation((prev) => prev + 90);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        onClick={onClose}>

        <div
          className="relative w-full h-full flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="text-white">
              <h3 className="text-lg font-medium">{currentFile.name}</h3>
              <p className="text-sm text-gray-300">
                {currentIndex + 1} of {files.length}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isImage &&
              <>
                  <button
                  onClick={handleZoomOut}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Zoom out">

                    <SafeIcon icon={FiZoomOut} />
                  </button>
                  <button
                  onClick={handleZoomIn}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Zoom in">

                    <SafeIcon icon={FiZoomIn} />
                  </button>
                  <button
                  onClick={handleRotate}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Rotate">

                    <SafeIcon icon={FiRotateCw} />
                  </button>
                </>
              }
              <a
                href={currentFile.url}
                download={currentFile.name}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Download">

                <SafeIcon icon={FiDownload} />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Close">

                <SafeIcon icon={FiX} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          {files.length > 1 &&
          <>
              <button
              onClick={prevFile}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full transition-colors z-10"
              title="Previous">

                <SafeIcon icon={FiChevronLeft} />
              </button>
              <button
              onClick={nextFile}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full transition-colors z-10"
              title="Next">

                <SafeIcon icon={FiChevronRight} />
              </button>
            </>
          }

          {/* File Content */}
          <div className="max-w-full max-h-full flex items-center justify-center">
            {isImage ?
            <img
              src={currentFile.url}
              alt={currentFile.name}
              className="max-w-none max-h-none object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxWidth: zoom === 1 ? '90vw' : 'none',
                maxHeight: zoom === 1 ? '80vh' : 'none'
              }} /> :

            isVideo ?
            <video
              src={currentFile.url}
              controls
              className="max-w-[90vw] max-h-[80vh]"
              autoPlay /> :


            <div className="bg-white rounded-lg p-8 text-center">
                <SafeIcon icon={FiMaximize2} className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentFile.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  This file type cannot be previewed
                </p>
                <a
                href={currentFile.url}
                download={currentFile.name}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">

                  <SafeIcon icon={FiDownload} />
                  <span>Download File</span>
                </a>
              </div>
            }
          </div>

          {/* Thumbnail Strip */}
          {files.length > 1 &&
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg">
              {files.map((file, index) =>
            <button
              key={file.id || index}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(1);
                setRotation(0);
              }}
              className={`w-12 h-12 rounded border-2 transition-colors overflow-hidden ${
              index === currentIndex ?
              'border-white' :
              'border-transparent hover:border-gray-400'}`
              }>

                  {file.type?.startsWith('image/') ?
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-cover"
                loading="lazy" /> :


              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <SafeIcon icon={FiMaximize2} className="text-white text-sm" />
                    </div>
              }
                </button>
            )}
            </div>
          }
        </div>
      </motion.div>
    </AnimatePresence>);

};

export default FilePreview;