import React,{useState,useEffect} from 'react'
import {HashRouter as Router,Routes,Route,Navigate} from 'react-router-dom'
import {motion} from 'framer-motion'
import {AuthProvider,useAuth} from './contexts/AuthContext'
import {MentionProvider} from './contexts/MentionContext'
import {QuestProvider} from '@questlabs/react-sdk'
import '@questlabs/react-sdk/dist/style.css'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import BugList from './components/BugList'
import BugDetails from './components/BugDetails'
import CreateBug from './components/CreateBug'
import Roadmap from './components/Roadmap'
import AdminPanel from './components/AdminPanel'
import Settings from './components/Settings'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import FeatureRequests from './components/FeatureRequests'
import PowerPrompts from './components/PowerPrompts'
import TipsAndTricks from './components/TipsAndTricks'
import GeneralTalk from './components/GeneralTalk'
import GeneralTalkDebug from './components/GeneralTalkDebug'
import TestMentions from './components/TestMentions'
import HelpCenter from './components/HelpCenter'
import AppHelp from './components/AppHelp'
import UserNotificationsService from './components/UserNotificationsService'
import questConfig from './config/questConfig'
import './App.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state={hasError: false,error: null}
  }

  static getDerivedStateFromError(error) {
    return {hasError: true,error}
  }

  componentDidCatch(error,errorInfo) {
    console.error('Error caught by boundary:',error,errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again</p>
            <button onClick={()=> window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const AuthenticatedLayout=({children})=> {
  const [sidebarOpen,setSidebarOpen]=useState(true)
  const {userProfile}=useAuth()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={()=> setSidebarOpen(!sidebarOpen)} />
      <motion.div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{duration: 0.3}}
      >
        {children}
        {/* Help Hub - Always visible on authenticated pages */}
        <AppHelp />
        
        {/* Email notification service - runs in the background */}
        <UserNotificationsService />
      </motion.div>
    </div>
  )
}

function App() {
  const [isOnline,setIsOnline]=useState(navigator.onLine)
  
  useEffect(()=> {
    const handleOnline=()=> setIsOnline(true)
    const handleOffline=()=> setIsOnline(false)
    
    window.addEventListener('online',handleOnline)
    window.addEventListener('offline',handleOffline)
    
    return ()=> {
      window.removeEventListener('online',handleOnline)
      window.removeEventListener('offline',handleOffline)
    }
  },[])
  
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Internet Connection</h1>
          <p className="text-gray-600">Please check your internet connection and try again</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <QuestProvider apiKey={questConfig.APIKEY} entityId={questConfig.ENTITYID} apiType="PRODUCTION" >
        <AuthProvider>
          <MentionProvider>
            <Router>
              <Routes>
                <Route path="/" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <Dashboard />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/bugs" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <BugList />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/bugs/:id" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <BugDetails />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/create-bug" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <CreateBug />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/roadmap" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <Roadmap />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/features" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <FeatureRequests />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/prompts" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <PowerPrompts />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/tips" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <TipsAndTricks />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/general-talk" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <GeneralTalk />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <HelpCenter />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/debug" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <GeneralTalkDebug />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/test-mentions" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <TestMentions />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly>
                  <AuthenticatedLayout>
                    <AdminPanel />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute>
                  <AuthenticatedLayout>
                    <Settings />
                  </AuthenticatedLayout>
                </ProtectedRoute>} />
                {/* Catch-all route to redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </MentionProvider>
        </AuthProvider>
      </QuestProvider>
    </ErrorBoundary>
  )
}

export default App