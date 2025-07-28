import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import AssigneeAutocomplete from './AssigneeAutocomplete';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiMap, FiX, FiCalendar, FiCheckCircle, FiAlertCircle, FiLoader } = FiIcons;

const MoveToRoadmapModal = ({ feature, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: feature?.title || '',
    description: feature?.description || '',
    status: 'planning',
    priority: feature?.priority || 'medium',
    quarter: '',
    estimated_completion: '',
    assignee: '',
    tags: feature?.tags ? feature.tags.join(',') : ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableQuarters, setAvailableQuarters] = useState([]);

  // Generate quarter options dynamically based on current date
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

    // Generate 8 quarters starting from current quarter
    const quarters = [];
    let year = currentYear;
    let quarter = currentQuarter;

    for (let i = 0; i < 8; i++) {
      quarters.push(`Q${quarter} ${year}`);
      quarter++;
      if (quarter > 4) {
        quarter = 1;
        year++;
      }
    }

    // Add 'Future' option
    quarters.push('Future');

    setAvailableQuarters(quarters);

    // Set default quarter in form to current quarter
    setForm((prev) => ({
      ...prev,
      quarter: `Q${currentQuarter} ${currentYear}`
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.quarter) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare tags array
      const tagsArray = form.tags ?
      form.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0) :
      [];

      // Create roadmap item
      const roadmapData = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        quarter: form.quarter,
        estimated_completion: form.estimated_completion || null,
        assignee: form.assignee || null,
        tags: tagsArray,
        attachments: feature.attachments || []
      };

      // Insert into roadmap_items_mgg2024 table
      const { data: roadmapItem, error: roadmapError } = await supabase.
      from('roadmap_items_mgg2024').
      insert([roadmapData]).
      select().
      single();

      if (roadmapError) throw roadmapError;

      // Update feature status to 'planned'
      const { error: featureError } = await supabase.
      from('feature_requests_mgg2024').
      update({
        status: 'planned',
        updated_at: new Date().toISOString()
      }).
      eq('id', feature.id);

      if (featureError) throw featureError;

      // Call success callback with the created roadmap item
      onSuccess(roadmapItem);
    } catch (error) {
      console.error('Error moving feature to roadmap:', error);
      setError(error.message || 'Failed to move feature to roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiMap} className="text-purple-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Move to Roadmap</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">

              <SafeIcon icon={FiX} />
            </button>
          </div>
          
          <div className="p-6">
            {error &&
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
                <SafeIcon icon={FiAlertCircle} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            }
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Roadmap item title"
                  required />

              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Detailed description of this roadmap item"
                  required />

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required>

                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required>

                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quarter *
                  </label>
                  <select
                    value={form.quarter}
                    onChange={(e) => setForm({ ...form, quarter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required>

                    {availableQuarters.map((quarter) =>
                    <option key={quarter} value={quarter}>
                        {quarter}
                      </option>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Completion
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiCalendar} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={form.estimated_completion}
                      onChange={(e) => setForm({ ...form, estimated_completion: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />

                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <AssigneeAutocomplete
                    value={form.assignee}
                    onChange={(value) => setForm({ ...form, assignee: value })}
                    placeholder="Person responsible" />

                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="UI,Performance,etc. (comma-separated)" />

                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">

                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2">

                  {loading ?
                  <>
                      <SafeIcon icon={FiLoader} className="animate-spin" />
                      <span>Processing...</span>
                    </> :

                  <>
                      <SafeIcon icon={FiCheckCircle} />
                      <span>Move to Roadmap</span>
                    </>
                  }
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>);

};

export default MoveToRoadmapModal;