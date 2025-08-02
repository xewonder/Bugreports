import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMention } from '../contexts/MentionContext';
import SafeIcon from '../common/SafeIcon';
import FileUpload from './FileUpload';
import AttachmentViewer from './AttachmentViewer';
import AssigneeAutocomplete from './AssigneeAutocomplete';
import DisplayMentionsTextarea from './DisplayMentionsTextarea';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiArrowLeft, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiPaperclip } = FiIcons;

const CreateBug = () => {
  const navigate = useNavigate();
  const { userProfile, isTechnician } = useAuth();
  const { processMentions } = useMention();

  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    priority: 'Medium',
    status: 'Open',
    assignee: '',
    tags: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    if (!userProfile) {
      setStatusMessage({
        type: 'error',
        message: 'You must be logged in to create a bug report'
      });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', message: '' });

    try {
      const tagsArray = form.tags ?
      form.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0) :
      [];

      const bugData = {
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        priority: form.priority,
        status: form.status,
        assignee: form.assignee || null,
        reporter_id: userProfile.id,
        reporter_name: userProfile.full_name || userProfile.nickname || 'Anonymous', // Add reporter_name
        tags: tagsArray,
        attachments: attachments
      };

      const { data, error } = await supabase.
      from('bugs_mgg2024').
      insert([bugData]).
      select();

      if (error) throw error;

      // Process mentions in the description
      if (data && data[0] && form.description.trim()) {
        processMentions(form.description.trim(), 'bug', data[0].id);
      }

      setStatusMessage({
        type: 'success',
        message: 'Bug report created successfully!'
      });

      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/bugs');
      }, 1500);
    } catch (error) {
      console.error('Error creating bug:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to create bug report: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-6">

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/bugs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">

            <SafeIcon icon={FiArrowLeft} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Bug</h1>
            <p className="text-gray-600">Report a new software bug with attachments</p>
          </div>
        </div>
      </motion.div>

      {/* Status Message */}
      {statusMessage.message &&
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
        statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`
        }>

          <SafeIcon
          icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle}
          className="flex-shrink-0" />

          <span>{statusMessage.message}</span>
        </motion.div>
      }

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-4xl">

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bug Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Brief description of the bug"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'}`
                  }
                  disabled={loading} />

                {errors.title &&
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                }
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <DisplayMentionsTextarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed description of the bug, steps to reproduce, expected behavior, etc. (Type @ to mention users)"
                  minRows={8}
                  className={`w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'}`
                  }
                  disabled={loading}
                />
                {errors.description &&
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                }
              </div>

              {/* File Upload */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <SafeIcon icon={FiPaperclip} className="mr-2" />
                  Attachments
                </label>
                <FileUpload
                  onFilesUploaded={setAttachments}
                  existingFiles={attachments}
                  maxFiles={5}
                  disabled={loading} />

                <p className="mt-2 text-xs text-gray-500">
                  Add screenshots, videos, or documents to help explain the bug
                </p>
                {/* Show attachments preview if any */}
                {attachments.length > 0 &&
                <div className="mt-4">
                    <AttachmentViewer files={attachments} compact />
                  </div>
                }
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas (e.g., UI, Mobile, Performance)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading} />

                <p className="mt-1 text-sm text-gray-500">
                  Tags help categorize and filter bugs
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Classification */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={form.severity}
                      onChange={(e) => handleChange('severity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}>

                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}>

                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}>

                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Assignment - Only for Technicians */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignee
                  </label>
                  <AssigneeAutocomplete
                    value={form.assignee}
                    onChange={(value) => handleChange('assignee', value)}
                    placeholder="Person responsible"
                    disabled={loading} />

                </div>
                {isTechnician() &&
                <div className="mt-4">
                    <label className="flex items-center space-x-3">
                      <input
                      type="checkbox"
                      checked={form.assignee === userProfile?.full_name}
                      onChange={(e) =>
                      handleChange(
                        'assignee',
                        e.target.checked ? userProfile?.full_name || '' : ''
                      )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={loading} />

                      <span className="text-sm text-gray-700">
                        Assign this bug to myself
                      </span>
                    </label>
                    {form.assignee &&
                  <p className="mt-2 text-sm text-gray-600">
                        Assigned to: {form.assignee}
                      </p>
                  }
                  </div>
                }
              </div>

              {/* Reporter Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporter</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {userProfile?.full_name?.[0] || userProfile?.nickname?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.full_name || userProfile?.nickname || 'Current User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {userProfile?.role || 'User'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">

                  {loading ?
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> :

                  <>
                      <SafeIcon icon={FiSave} />
                      <span>Create Bug Report</span>
                    </>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/bugs')}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">

                  <SafeIcon icon={FiX} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>);

};

export default CreateBug;