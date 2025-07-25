import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { 
  FiUpload, FiX, FiFile, FiImage, FiVideo, 
  FiDownload, FiEye, FiTrash2, FiLoader 
} = FiIcons;

// Simple UUID generator to avoid external dependency
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const FileUpload = ({
  onFilesUploaded,
  existingFiles = [],
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'image/*',
    'video/*',
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.zip'
  ],
  disabled = false,
  showPreview = true,
  compact = false
}) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const getFileIcon = (fileType, fileName) => {
    if (fileType?.startsWith('image/')) return FiImage;
    if (fileType?.startsWith('video/')) return FiVideo;
    if (fileName?.toLowerCase().endsWith('.pdf')) return FiFile;
    return FiFile;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      if (type.includes('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percent
            }));
          }
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return {
        id: generateUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFiles = async (fileList) => {
    if (disabled) return;

    const newFiles = Array.from(fileList);

    // Check file count limit
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validationErrors = newFiles.map(validateFile).filter(Boolean);
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of newFiles) {
        const uploadedFile = await uploadFile(file);
        uploadedFiles.push(uploadedFile);
      }

      const updatedFiles = [...files, ...uploadedFiles];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = async (fileIndex) => {
    const file = files[fileIndex];

    // Delete from Supabase Storage if it has a path
    if (file.path) {
      try {
        await supabase.storage
          .from('attachments')
          .remove([file.path]);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    const updatedFiles = files.filter((_, index) => index !== fileIndex);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const openFile = (file) => {
    window.open(file.url, '_blank');
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            disabled={disabled || uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || files.length >= maxFiles}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <SafeIcon icon={FiLoader} className="animate-spin" />
            ) : (
              <SafeIcon icon={FiUpload} />
            )}
            <span>Attach</span>
          </button>
          <span className="text-xs text-gray-500">
            {files.length}/{maxFiles}
          </span>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {files.map((file, index) => (
              <div
                key={file.id || index}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
              >
                <SafeIcon icon={getFileIcon(file.type, file.name)} className="text-xs" />
                <span className="truncate max-w-20">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-blue-500 hover:text-red-600"
                >
                  <SafeIcon icon={FiX} className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />
        <div className="space-y-2">
          <SafeIcon
            icon={uploading ? FiLoader : FiUpload}
            className={`text-4xl mx-auto text-gray-400 ${uploading ? 'animate-spin' : ''}`}
          />
          <div>
            <p className="text-gray-600">
              {uploading ? 'Uploading files...' : 'Drop files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported: {acceptedTypes.join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || files.length >= maxFiles}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{fileName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && showPreview && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Attached Files ({files.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {files.map((file, index) => (
              <motion.div
                key={file.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <SafeIcon
                  icon={getFileIcon(file.type, file.name)}
                  className="text-blue-600 text-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openFile(file)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View file"
                  >
                    <SafeIcon icon={FiEye} />
                  </button>
                  <a
                    href={file.url}
                    download={file.name}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download file"
                  >
                    <SafeIcon icon={FiDownload} />
                  </a>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove file"
                  >
                    <SafeIcon icon={FiTrash2} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;