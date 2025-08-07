import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';
import { format } from 'date-fns';

const { FiUsers, FiShield, FiEdit3, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiSearch, FiFilter, FiUser, FiMail, FiCalendar, FiTrash2, FiEye, FiLock, FiUnlock } = FiIcons;

const UserRoleManagement = () => {
  const { userProfile, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [editingUser, setEditingUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [bulkActions, setBulkActions] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Role definitions with permissions
  const roleDefinitions = {
    user: {
      label: 'User',
      color: 'bg-green-100 text-green-800 border-green-200',
      permissions: ['Create bugs', 'Comment on bugs', 'Vote on features', 'View roadmap'],
      description: 'Standard user with basic permissions'
    },
    developer: {
      label: 'Developer',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      permissions: ['All user permissions', 'Manage bugs', 'Edit roadmap', 'Assign bugs'],
      description: 'Technical team member with development permissions'
    },
    admin: {
      label: 'Administrator',
      color: 'bg-red-100 text-red-800 border-red-200',
      permissions: ['All permissions', 'User management', 'System settings', 'Data management'],
      description: 'Full system access and user management'
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, roleFilter, statusFilter, sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles_mgg_2024')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to load users: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(lowerSearch) ||
        user.email?.toLowerCase().includes(lowerSearch) ||
        user.nickname?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter.toLowerCase());
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        filtered = filtered.filter(user => user.is_active !== false);
      } else if (statusFilter === 'Inactive') {
        filtered = filtered.filter(user => user.is_active === false);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'email':
          return a.email.localeCompare(b.email);
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredUsers(filtered);
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      // Validate role
      if (updates.role && !['user', 'developer', 'admin'].includes(updates.role)) {
        throw new Error('Invalid role selected');
      }

      // Prevent self-demotion from admin
      if (userId === userProfile?.id && updates.role && updates.role !== 'admin') {
        throw new Error('You cannot change your own admin role');
      }

      // Sanitize update payload
      const ALLOWED_FIELDS = ['email','full_name','nickname','role','is_active'];
      const updateData = ALLOWED_FIELDS.reduce((acc, key) => {
        if (Object.prototype.hasOwnProperty.call(updates, key)) acc[key] = updates[key];
        return acc;
      }, {});
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles_mgg_2024')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No user was updated');
      }

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      ));

      setEditingUser(null);
      setStatusMessage({
        type: 'success',
        message: 'User updated successfully'
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      console.error('Error updating user:', error);
      setStatusMessage({
        type: 'error',
        message: error.message || 'Failed to update user'
      });
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (userId === userProfile?.id) {
      setStatusMessage({
        type: 'error',
        message: 'You cannot deactivate your own account'
      });
      return;
    }

    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await handleUpdateUser(userId, { is_active: false });
      setStatusMessage({
        type: 'success',
        message: 'User deactivated successfully'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: 'Failed to deactivate user'
      });
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await handleUpdateUser(userId, { is_active: true });
      setStatusMessage({
        type: 'success',
        message: 'User activated successfully'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: 'Failed to activate user'
      });
    }
  };

  const handleBulkRoleUpdate = async (newRole) => {
    if (bulkActions.length === 0) return;

    // Prevent self-demotion
    if (bulkActions.includes(userProfile?.id) && newRole !== 'admin') {
      setStatusMessage({
        type: 'error',
        message: 'You cannot change your own admin role'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to change ${bulkActions.length} users to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles_mgg_2024')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .in('id', bulkActions);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user =>
        bulkActions.includes(user.id) ? { ...user, role: newRole } : user
      ));

      setBulkActions([]);
      setShowBulkActions(false);
      setStatusMessage({
        type: 'success',
        message: `Successfully updated ${bulkActions.length} users`
      });

      setTimeout(() => {
        setStatusMessage({ type: '', message: '' });
      }, 3000);

    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: 'Failed to update users: ' + error.message
      });
    }
  };

  const toggleBulkSelection = (userId) => {
    setBulkActions(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    setBulkActions(filteredUsers.map(user => user.id));
  };

  const clearBulkSelection = () => {
    setBulkActions([]);
  };

  const getRoleColor = (role) => {
    return roleDefinitions[role]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleLabel = (role) => {
    return roleDefinitions[role]?.label || role;
  };

  if (!isAdmin()) {
    return (
      <div className="p-6 text-center">
        <SafeIcon icon={FiShield} className="text-red-500 text-6xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You need administrator privileges to access user role management.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <SafeIcon icon={FiUsers} className="mr-3 text-blue-600" />
            User Role Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions across the MGG™ system
          </p>
        </div>
        
        {/* Role Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {Object.entries(roleDefinitions).map(([role, def]) => (
            <div key={role} className="bg-white rounded-lg p-3 shadow-sm border">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${def.color}`}>
                {def.label}
              </div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {users.filter(u => u.role === role).length}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Status Message */}
      {statusMessage.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          <SafeIcon
            icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle}
            className="flex-shrink-0"
          />
          <span>{statusMessage.message}</span>
          <button
            onClick={() => setStatusMessage({ type: '', message: '' })}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <SafeIcon icon={FiX} />
          </button>
        </motion.div>
      )}

      {/* Role Definitions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Definitions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(roleDefinitions).map(([role, def]) => (
            <div key={role} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${def.color}`}>
                  {def.label}
                </span>
                <SafeIcon icon={FiShield} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-3">{def.description}</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Permissions:</p>
                {def.permissions.map((permission, index) => (
                  <p key={index} className="text-xs text-gray-600">• {permission}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Administrator</option>
            <option value="Developer">Developer</option>
            <option value="User">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at">Registration Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
          </select>

          {/* Bulk Actions Toggle */}
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showBulkActions
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bulk Actions
          </button>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {bulkActions.length} users selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={selectAllFiltered}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All ({filteredUsers.length})
                </button>
                <button
                  onClick={clearBulkSelection}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {bulkActions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Change role to:</span>
                {Object.entries(roleDefinitions).map(([role, def]) => (
                  <button
                    key={role}
                    onClick={() => handleBulkRoleUpdate(role)}
                    className={`px-3 py-1 rounded text-sm font-medium border ${def.color} hover:opacity-80`}
                  >
                    {def.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showBulkActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={bulkActions.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => e.target.checked ? selectAllFiltered() : clearBulkSelection()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`${user.is_active === false ? 'bg-gray-50' : ''} ${
                    bulkActions.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  {showBulkActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={bulkActions.includes(user.id)}
                        onChange={() => toggleBulkSelection(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiUser} className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        {editingUser && editingUser.id === user.id ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editingUser.full_name || ''}
                              onChange={(e) =>
                                setEditingUser({ ...editingUser, full_name: e.target.value })
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                              placeholder="Full name"
                            />
                            <input
                              type="text"
                              value={editingUser.nickname || ''}
                              onChange={(e) =>
                                setEditingUser({ ...editingUser, nickname: e.target.value })
                              }
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                              placeholder="Display name"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Unnamed User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.nickname || '-'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <SafeIcon icon={FiMail} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser && editingUser.id === user.id ? (
                      <select
                        value={editingUser.role || 'user'}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, role: e.target.value })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        disabled={user.id === userProfile?.id}
                      >
                        <option value="user">User</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser && editingUser.id === user.id ? (
                      <select
                        value={editingUser.is_active === false ? 'inactive' : 'active'}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, is_active: e.target.value === 'active' })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        disabled={user.id === userProfile?.id}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active === false
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <SafeIcon icon={FiCalendar} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingUser && editingUser.id === user.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateUser(user.id, editingUser)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Save Changes"
                        >
                          <SafeIcon icon={FiSave} />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Cancel"
                        >
                          <SafeIcon icon={FiX} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingUser({ ...user })}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit User"
                        >
                          <SafeIcon icon={FiEdit3} />
                        </button>
                        
                        {user.id !== userProfile?.id && (
                          <>
                            {user.is_active === false ? (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Activate User"
                              >
                                <SafeIcon icon={FiUnlock} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeactivateUser(user.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Deactivate User"
                              >
                                <SafeIcon icon={FiLock} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={showBulkActions ? "7" : "6"}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active !== false).length}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Administrators</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'developer').length}
            </div>
            <div className="text-sm text-gray-600">Developers</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserRoleManagement;
