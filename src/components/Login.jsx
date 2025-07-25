import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import SafeIcon from '../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } = FiIcons

const APP_VERSION = "1.0.2"

const Login = () => {
  const navigate = useNavigate()
  const { signIn, signUp, user, userProfile, loading: authLoading, error: authError } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' })
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const hasNavigated = useRef(false)
  const mounted = useRef(true)

  // Show auth error if present
  useEffect(() => {
    if (authError) {
      setStatusMessage({ type: 'error', message: authError })
    }
  }, [authError])

  // Redirect if authenticated
  useEffect(() => {
    mounted.current = true
    if (user && userProfile && !authLoading && !hasNavigated.current) {
      hasNavigated.current = true
      navigate('/', { replace: true })
    }
    return () => {
      mounted.current = false
    }
  }, [user, userProfile, authLoading, navigate])

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!isLogin && !form.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!isLogin && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm() || loading) return

    setLoading(true)
    setStatusMessage({ type: '', message: '' })

    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
        
        setStatusMessage({ 
          type: 'success', 
          message: 'Sign in successful! Redirecting...' 
        })
      } else {
        const { error } = await signUp(form.email, form.password, form.fullName)
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.')
          }
          throw error
        }
        
        setStatusMessage({ 
          type: 'success', 
          message: 'Registration successful! Please sign in with your credentials.' 
        })
        setIsLogin(true)
        setForm({ ...form, password: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Auth error:', error)
      setStatusMessage({ 
        type: 'error', 
        message: error.message || 'An unexpected error occurred' 
      })
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 overflow-hidden">
            <img 
              src="https://ph-files.imgix.net/c6228782-80c0-4dfe-b90a-25b9a704de70.png?auto=format" 
              alt="MGG Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-gray-600" dangerouslySetInnerHTML={{
            __html: isLogin 
              ? 'Access your <b>M</b>ake <b>G</b>reta <b>G</b>reat account'
              : 'Join the <b>M</b>ake <b>G</b>reta <b>G</b>reat community'
          }} />
          <div className="text-xs text-gray-500 mt-2">Version {APP_VERSION}</div>
        </div>

        {/* Status Message */}
        {statusMessage.message && (
          <div className={`p-4 mb-6 rounded-lg flex items-start space-x-2 ${
            statusMessage.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            <SafeIcon 
              icon={statusMessage.type === 'success' ? FiCheckCircle : FiAlertCircle} 
              className="mt-0.5"
            />
            <span>{statusMessage.message}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SafeIcon icon={FiMail} className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Full Name - Only on Register */}
          {!isLogin && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiUser} className="text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SafeIcon icon={FiLock} className="text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder={isLogin ? '********' : 'Minimum 6 characters'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <SafeIcon
                  icon={showPassword ? FiEyeOff : FiEye}
                  className="text-gray-400 hover:text-gray-600"
                />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password - Only on Register */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiLock} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-blue-400"
          >
            {loading || authLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          {/* Toggle Login/Register */}
          <div className="text-center mt-4">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default Login