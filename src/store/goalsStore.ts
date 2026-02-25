import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Goal {
    id: string
    user_id: string
    title: string
    description: string | null
    target_amount: number
    current_amount: number
    target_date: string | null
    image_url: string | null
    is_completed: boolean
    created_at: string
}

interface GoalsState {
    goals: Goal[]
    isLoading: boolean
    error: string | null
    fetchGoals: () => Promise<void>
    addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'current_amount' | 'is_completed' | 'created_at'> & { current_amount?: number }) => Promise<void>
    updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>
    deleteGoal: (id: string) => Promise<void>
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
    goals: [],
    isLoading: false,
    error: null,

    fetchGoals: async () => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('title')

            if (error) throw error
            set({ goals: data as Goal[] })
        } catch (err: any) {
            set({ error: err.message })
        } finally {
            set({ isLoading: false })
        }
    },

    addGoal: async (goalData) => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('goals')
                .insert([{ ...goalData, user_id: userData.user.id }])
                .select()
                .single()

            if (error) throw error

            const currentGoals = get().goals
            set({ goals: [...currentGoals, data as Goal] })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    updateGoal: async (id, goalData) => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .update(goalData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            const currentGoals = get().goals
            set({ goals: currentGoals.map(g => g.id === id ? (data as Goal) : g) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    deleteGoal: async (id) => {
        try {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', id)

            if (error) throw error

            const currentGoals = get().goals
            set({ goals: currentGoals.filter(g => g.id !== id) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    }
}))
