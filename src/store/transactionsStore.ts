import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Transaction {
    id: string
    user_id: string
    account_id: string
    category_id: string | null
    description: string
    amount: number
    type: 'income' | 'expense' | 'transfer'
    date: string
    is_consolidated: boolean
    is_recurring: boolean
    recurrence_rule: string | null
    recurrence_group_id: string | null
    installment_current: number | null
    installment_total: number | null
    notes: string | null
    attachment_url: string | null
    transfer_peer_id: string | null
}

interface TransactionsState {
    transactions: Transaction[]
    isLoading: boolean
    error: string | null
    currentMonth: Date
    setCurrentMonth: (date: Date) => void
    fetchTransactions: (startDate: string, endDate: string) => Promise<void>
    addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>
    updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
    deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
    transactions: [],
    isLoading: false,
    error: null,
    currentMonth: new Date(),

    setCurrentMonth: (date) => set({ currentMonth: date }),

    fetchTransactions: async (startDate, endDate) => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false })

            if (error) throw error
            set({ transactions: data as Transaction[] })
        } catch (err: any) {
            set({ error: err.message })
        } finally {
            set({ isLoading: false })
        }
    },

    addTransaction: async (transactionData) => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('transactions')
                .insert([{ ...transactionData, user_id: userData.user.id }])
                .select()
                .single()

            if (error) throw error

            const currentTransactions = get().transactions
            // Simplified: just add to list, sorting could be better handled by a refetch if needed
            set({ transactions: [data as Transaction, ...currentTransactions] })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    updateTransaction: async (id, transactionData) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .update(transactionData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            const currentTransactions = get().transactions
            set({ transactions: currentTransactions.map(t => t.id === id ? (data as Transaction) : t) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    deleteTransaction: async (id) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) throw error

            const currentTransactions = get().transactions
            set({ transactions: currentTransactions.filter(t => t.id !== id) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    }
}))
