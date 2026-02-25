import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Budget {
    id: string
    user_id: string
    category_id: string
    month: number
    year: number
    amount: number
    created_at: string
}

interface BudgetsState {
    budgets: Budget[]
    isLoading: boolean
    error: string | null
    fetchBudgets: (month: number, year: number) => Promise<void>
    addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => Promise<void>
    updateBudget: (id: string, data: Partial<Budget>) => Promise<void>
    deleteBudget: (id: string) => Promise<void>
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
    budgets: [],
    isLoading: false,
    error: null,

    fetchBudgets: async (month, year) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('month', month)
                .eq('year', year)
                .order('created_at')

            if (error) throw error
            set({ budgets: data as Budget[] })
        } catch (err: any) {
            set({ error: err.message })
        } finally {
            set({ isLoading: false })
        }
    },

    addBudget: async (budgetData) => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('budgets')
                .insert([{ ...budgetData, user_id: userData.user.id }])
                .select()
                .single()

            if (error) throw error
            set({ budgets: [...get().budgets, data as Budget] })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    updateBudget: async (id, data) => {
        try {
            const { data: updated, error } = await supabase
                .from('budgets')
                .update(data)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            set({ budgets: get().budgets.map(b => b.id === id ? (updated as Budget) : b) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    deleteBudget: async (id) => {
        try {
            const { error } = await supabase.from('budgets').delete().eq('id', id)
            if (error) throw error
            set({ budgets: get().budgets.filter(b => b.id !== id) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    }
}))
