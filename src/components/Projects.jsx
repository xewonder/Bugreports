import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiFolderOpen, FiBug, FiUsers } = FiIcons;

const Projects = ({ projects, setProjects, bugs }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingProject) {
      setProjects(projects.map((p) =>
      p.id === editingProject.id ?
      { ...editingProject, ...form } :
      p
      ));
      setEditingProject(null);
    } else {
      const newProject = {
        id: Date.now(),
        ...form,
        bugsCount: 0
      };
      setProjects([...projects, newProject]);
    }

    setForm({ name: '', description: '' });
    setShowCreateForm(false);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description
    });
    setShowCreateForm(true);
  };

  const handleDelete = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter((p) => p.id !== projectId));
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingProject(null);
    setForm({ name: '', description: '' });
  };

  const getProjectStats = (projectName) => {
    const projectBugs = bugs.filter((bug) => bug.project === projectName);
    return {
      total: projectBugs.length,
      open: projectBugs.filter((bug) => bug.status === 'Open').length,
      inProgress: projectBugs.filter((bug) => bug.status === 'In Progress').length,
      resolved: projectBugs.filter((bug) => bug.status === 'Resolved').length
    };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage your development projects</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">

          <SafeIcon icon={FiPlus} />
          <span>New Project</span>
        </button>
      </motion.div>

      {/* Create/Edit Form */}
      {showCreateForm &&
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-8">

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter project name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />

            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />

            </div>
            
            <div className="flex items-center space-x-4">
              <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">

                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
              <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors">

                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      }

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {projects.map((project, index) => {
          const stats = getProjectStats(project.name);

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">

              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <SafeIcon icon={FiFolderOpen} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Project">

                    <SafeIcon icon={FiEdit3} className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Project">

                    <SafeIcon icon={FiTrash2} className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Project Description */}
              <p className="text-gray-600 mb-4 text-sm">{project.description}</p>

              {/* Project Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Bugs</span>
                  <span className="font-semibold text-gray-900">{stats.total}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-semibold text-red-600">{stats.open}</div>
                    <div className="text-red-500">Open</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-semibold text-yellow-600">{stats.inProgress}</div>
                    <div className="text-yellow-500">In Progress</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">{stats.resolved}</div>
                    <div className="text-green-500">Resolved</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {stats.total > 0 &&
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(stats.resolved / stats.total * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.resolved / stats.total * 100}%` }}>
                    </div>
                    </div>
                  </div>
                }
              </div>
            </motion.div>);

        })}

        {projects.length === 0 && !showCreateForm &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full text-center py-12">

            <SafeIcon icon={FiFolderOpen} className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">Create your first project to get started</p>
            <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">

              Create Project
            </button>
          </motion.div>
        }
      </motion.div>
    </div>);

};

export default Projects;