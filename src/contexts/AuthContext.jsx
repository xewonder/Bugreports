import React,{createContext,useState,useContext,useEffect,useRef} from 'react'
import supabase from '../lib/supabase'

const AuthContext=createContext()

export function AuthProvider({children}) {
  const [user,setUser]=useState(null)
  const [userProfile,setUserProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [initialized,setInitialized]=useState(false)
  const [error,setError]=useState(null)
  const mounted=useRef(true)

  // Clear auth state
  const clearAuthState=()=> {
    setUser(null)
    setUserProfile(null)
    setError(null)
    setLoading(false)
  }

  // Get or create user profile
  const getOrCreateProfile=async (userId,email,metadata={})=> {
    try {
      // First try to get existing profile
      let {data: profile,error: fetchError}=await supabase
        .from('profiles_mgg_2024')
        .select('*')
        .eq('id',userId)
        .single()

      if (fetchError || !profile) {
        // Determine role based on email
        const role=email==='admin@mgg.com' ? 'admin' : email==='tech@mgg.com' ? 'developer' : 'user'

        // Create new profile
        const {data: newProfile,error: insertError}=await supabase
          .from('profiles_mgg_2024')
          .insert([{
            id: userId,
            email: email,
            full_name: metadata.full_name || email.split('@')[0],
            nickname: metadata.nickname || metadata.full_name || email.split('@')[0],
            role: role,
            is_active: true
          }])
          .select()
          .single()

        if (insertError) throw insertError
        profile=newProfile
      }

      return profile
    } catch (error) {
      console.error('Profile error:',error)
      throw error
    }
  }

  // Initialize auth state
  useEffect(()=> {
    let authListener

    const initializeAuth=async ()=> {
      try {
        console.log('🔄 Initializing auth...')

        // Get initial session
        const {data: {session},error: sessionError}=await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          console.log('✅ Found existing session')
          setUser(session.user)
          const profile=await getOrCreateProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata
          )
          setUserProfile(profile)
          console.log('✅ Profile loaded:',profile.nickname || profile.full_name)
        } else {
          console.log('ℹ️ No existing session found')
        }

        // Listen for auth changes
        authListener=supabase.auth.onAuthStateChange(async (event,session)=> {
          console.log('🔄 Auth state change:',event)
          if (event==='SIGNED_IN' && session?.user) {
            setUser(session.user)
            const profile=await getOrCreateProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata
            )
            setUserProfile(profile)
          } else if (event==='SIGNED_OUT') {
            clearAuthState()
          }
        })
      } catch (error) {
        console.error('❌ Auth initialization error:',error)
        setError(error.message)
      } finally {
        setLoading(false)
        setInitialized(true)
        console.log('✅ Auth initialization complete')
      }
    }

    initializeAuth()

    return ()=> {
      mounted.current=false
      if (authListener) authListener.subscription.unsubscribe()
    }
  },[])

  // Sign in
  const signIn=async (email,password)=> {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Signing in...')

      const {data,error}=await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) throw error
      console.log('✅ Sign in successful')
      return {data}
    } catch (error) {
      console.error('❌ Sign in error:',error)
      setError(error.message)
      return {error}
    } finally {
      setLoading(false)
    }
  }

  // Sign up - Updated to accept displayName
  const signUp=async (email,password,fullName,displayName)=> {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Signing up...')

      const {data,error}=await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            nickname: displayName.trim()
          }
        }
      })

      if (error) throw error
      console.log('✅ Sign up successful')
      return {data}
    } catch (error) {
      console.error('❌ Sign up error:',error)
      setError(error.message)
      return {error}
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut=async ()=> {
    try {
      console.log('🔄 Signing out...')
      await supabase.auth.signOut()
      clearAuthState()
      console.log('✅ Sign out successful')
    } catch (error) {
      console.error('❌ Sign out error:',error)
      clearAuthState()
    }
  }

  // Reset password
  const resetPassword=async (email)=> {
    try {
      const {data,error}=await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {redirectTo: `${window.location.origin}/reset-password`}
      )
      if (error) throw error
      return {data}
    } catch (error) {
      console.error('Reset password error:',error)
      setError(error.message)
      return {error}
    }
  }

  // Update profile
  const updateUserProfile=async (userId,updates)=> {
    if (!userProfile || userProfile.id !==userId) {
      return {error: {message: 'Cannot update profile: user not authenticated'}}
    }

    try {
      const {data,error}=await supabase
        .from('profiles_mgg_2024')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id',userId)
        .select()
        .single()

      if (error) throw error
      setUserProfile(data)
      return {data}
    } catch (error) {
      console.error('Update profile error:',error)
      setError(error.message)
      return {error}
    }
  }

  // Update user role (admin only)
  const updateUserRole=async (userId,newRole)=> {
    if (!isAdmin()) {
      return {error: {message: 'Only admins can update user roles'}}
    }

    try {
      const {data,error}=await supabase
        .from('profiles_mgg_2024')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id',userId)
        .select()
        .single()

      if (error) throw error
      return {data}
    } catch (error) {
      console.error('Update user role error:',error)
      return {error}
    }
  }

  // Role checks
  const isAdmin=()=> userProfile?.role==='admin'
  const isTechnician=()=> userProfile?.role==='developer' || userProfile?.role==='admin'

  // Access control
  const canEditBug=(bugId)=> isTechnician() || userProfile?.id===bugId
  const canChangeBugStatus=(bugId)=> isTechnician()

  // Retry profile fetch
  const retryProfileFetch=async ()=> {
    if (user) {
      try {
        setLoading(true)
        setError(null)
        const profile=await getOrCreateProfile(user.id,user.email,user.user_metadata)
        setUserProfile(profile)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const value={
    user,
    userProfile,
    loading,
    initialized,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    updateUserRole,
    isAdmin,
    isTechnician,
    canEditBug,
    canChangeBugStatus,
    retryProfileFetch
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}