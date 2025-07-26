import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useAuth} from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';
import {format} from 'date-fns';

const {FiSearch, FiEdit3, FiSave, FiX, FiTrash2, FiUserPlus, FiCheckCircle, FiAlertCircle, FiUser, FiMail, FiCalendar, FiShield, FiFilter} = FiIcons;

const UserManagement = () => {
  const {userProfile, updateUserRole} = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [editingUser, setEditingUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState({type: '', message: ''});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const {data, error} = await supabase
        .from('profiles_mgg_2024')
        .select('*')
        .order('created_at', {ascending: false});

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setStatusMessage({type: 'error', message: 'Failed to load users: ' + error.message});
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter(user => user.role === roleFilter.toLowerCase());
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'email') {
        return a.email.localeCompare(b.email);
      }
      if (sortBy === 'name') {
        return (a.full_name || '').localeCompare(b.full_name || '');
      }
      if (sortBy === 'role') {
        return (a.role || '').localeCompare(b.role || '');
      }
      return 0;
    });

    setFilteredUsers(filtered);
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      // Validate role if it's being updated
      if (updates.role && !['user', 'developer', 'admin'].includes(updates.role)) {
        throw new Error('Invalid role selected');
      }

      // Update user in Supabase - FIX: Add single() to ensure only one record is returned
      const {data, error} = await supabase
        .from('profiles_mgg_2024')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();  // Add this to ensure only one row is returned

      if (error) {
        throw error;
      }

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === userId ? {...user, ...updates, updated_at: new Date().toISOString()} : user
      );
      setUsers(updatedUsers);
      setEditingUser(null);

      // If updating role, use the role update function
      if (updates.role) {
        const result = await updateUserRole(userId, updates.role);
        if (result.error) throw result.error;
      }

      setStatusMessage({type: 'success', message: 'User updated successfully'});
    } catch (error) {
      console.error('Error updating user:', error);
      setStatusMessage({
        type: 'error', 
        message: error.message === 'Invalid role selected' 
          ? 'Invalid role. Please select user, developer, or admin.' 
          : 'Failed to update user: ' + error.message
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      // Instead of deleting the user, mark them as inactive
      const {error} = await supabase
        .from('profiles_mgg_2024')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => user.id === userId ? {...user, is_active: false} : user));
      setStatusMessage({type: 'success', message: 'User deactivated successfully'});
    } catch (error) {
      console.error('Error deactivating user:', error);
      setStatusMessage({type: 'error', message: 'Failed to deactivate user: ' + error.message});
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'developer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {statusMessage.message && (
        <motion.div
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}
          className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          <SafeIcon icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle} className="flex-shrink-0" />
          <span>{statusMessage.message}</span>
          <button
            onClick={() => setStatusMessage({type: '', message: ''})}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <SafeIcon icon={FiX} />
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiFilter} className="text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Developer">Developer</option>
              <option value="User">User</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Registration Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.is_active === false ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiUser} className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        {editingUser && editingUser.id === user.id ? (
                          <input
                            type="text"
                            value={editingUser.full_name || ''}
                            onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'Unnamed User'}</div>
                            <div className="text-sm text-gray-500">{user.nickname || '-'}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <SafeIcon icon={FiMail} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser && editingUser.id === user.id ? (
                      <select
                        value={editingUser.role || 'user'}
                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleColor(user.role)}`}>
                        {user.role || 'user'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <SafeIcon icon={FiCalendar} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser && editingUser.id === user.id ? (
                      <select
                        value={editingUser.is_active === false ? 'inactive' : 'active'}
                        onChange={(e) => setEditingUser({...editingUser, is_active: e.target.value === 'active'})}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active === false ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingUser && editingUser.id === user.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateUser(user.id, editingUser)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <SafeIcon icon={FiSave} />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <SafeIcon icon={FiX} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingUser({...user})}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <SafeIcon icon={FiEdit3} />
                        </button>
                        {user.id !== userProfile?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;