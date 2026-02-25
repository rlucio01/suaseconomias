import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

import Login from '@/app/Login'
import MainLayout from '@/app/MainLayout'
import Dashboard from '@/app/Dashboard'
import Transactions from '@/app/Transactions'
import Settings from '@/app/Settings'
import Goals from '@/app/Goals'

export default function App() {
  const { setUser, setIsLoading } = useAuthStore()

  useEffect(() => {
    // Determine user status at launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setIsLoading])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes directly mapped to the Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="goals" element={<Goals />} />
          <Route path="settings" element={<Settings />} />
          <Route path="budget" element={<div className="p-8 text-center text-text-secondary">Orçamentos em breve</div>} />
          <Route path="analysis" element={<div className="p-8 text-center text-text-secondary">Análise em breve</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
