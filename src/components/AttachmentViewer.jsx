import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import FilePreview from './FilePreview';
import * as FiIcons from 'react-icons/fi';

const {
  FiImage, FiFile, FiVideo, FiDownload,
  FiEye, FiPaperclip, FiExternalLink
} = FiIcons;

const AttachmentViewer = ({
  files = [],
  compact = false,
  showCount = true,
  className = ""
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!files || files.length === 0) return null;

  const getFileIcon = (fileType, fileName) => {
    if (fileType?.startsWith('image/')) return FiImage;
    if (fileType?.startsWith('video/')) return FiVideo;
    if (fileName?.toLowerCase().endsWith('.pdf')) return FiFile;
    return FiFile;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openPreview = (index) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const imageFiles = files.filter((file) => file.type?.startsWith('image/'));
  const otherFiles = files.filter((file) => !file.type?.startsWith('image/'));

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiPaperclip} className="text-gray-400 text-sm" />
          {showCount &&
          <span className="text-sm text-gray-600">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          }
          <div className="flex space-x-1">
            {files.slice(0, 3).map((file, index) =>
            <button
              key={file.id || index}
              onClick={() => openPreview(index)}
              className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
              title={file.name}>

                <SafeIcon icon={getFileIcon(file.type, file.name)} className="text-gray-600 text-xs" />
              </button>
            )}
            {files.length > 3 &&
            <span className="text-xs text-gray-500 px-1">
                +{files.length - 3}
              </span>
            }
          </div>
        </div>
        {previewOpen &&
        <FilePreview
          files={files}
          initialIndex={previewIndex}
          onClose={() => setPreviewOpen(false)} />

        }
      </div>);

  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Gallery */}
      {imageFiles.length > 0 &&
      <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Images ({imageFiles.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {imageFiles.map((file, index) =>
          <motion.button
            key={file.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => openPreview(files.indexOf(file))}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition-opacity group">

                <img
              src={file.url}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy" />

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <SafeIcon icon={FiEye} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                  {formatFileSize(file.size)}
                </div>
              </motion.button>
          )}
          </div>
        </div>
      }

      {/* Other Files */}
      {otherFiles.length > 0 &&
      <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Files ({otherFiles.length})
          </h4>
          <div className="space-y-2">
            {otherFiles.map((file, index) =>
          <motion.div
            key={file.id || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">

                <SafeIcon
              icon={getFileIcon(file.type, file.name)}
              className="text-blue-600 text-xl flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {file.type?.startsWith('video/') ?
              <button
                onClick={() => openPreview(files.indexOf(file))}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Preview">

                      <SafeIcon icon={FiEye} />
                    </button> :

              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Open">

                      <SafeIcon icon={FiExternalLink} />
                    </a>
              }
                  <a
                href={file.url}
                download={file.name}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Download">

                    <SafeIcon icon={FiDownload} />
                  </a>
                </div>
              </motion.div>
          )}
          </div>
        </div>
      }

      {previewOpen &&
      <FilePreview
        files={files}
        initialIndex={previewIndex}
        onClose={() => setPreviewOpen(false)} />

      }
    </div>);

};

export default AttachmentViewer;