import { useState } from 'react';
import supabase from '../lib/supabase';

// Simple UUID generator to avoid external dependency
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
};

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const uploadFiles = async (files, folder = 'uploads') => {
    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage.
        from('attachments').
        upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round(progress.loaded / progress.total * 100);
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percent
            }));
          }
        });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage.
        from('attachments').
        getPublicUrl(filePath);

        uploadedFiles.push({
          id: generateUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          path: filePath
        });
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const deleteFile = async (filePath) => {
    try {
      const { error } = await supabase.storage.
      from('attachments').
      remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadFiles,
    deleteFile
  };
};