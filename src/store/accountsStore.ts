import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Account {
    id: string
    user_id: string
    name: string
    type: 'checking' | 'savings' | 'investment' | 'cash'
    balance: number
    color: string | null
    icon: string | null
    is_active: boolean
}

interface AccountsState {
    accounts: Account[]
    isLoading: boolean
    error: string | null
    fetchAccounts: () => Promise<void>
    addAccount: (account: Omit<Account, 'id' | 'user_id' | 'balance'> & { balance?: number }) => Promise<void>
    updateAccount: (id: string, account: Partial<Account>) => Promise<void>
    deleteAccount: (id: string) => Promise<void>
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
    accounts: [],
    isLoading: false,
    error: null,

    fetchAccounts: async () => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .order('name')

            if (error) throw error
            set({ accounts: data as Account[] })
        } catch (err: any) {
            set({ error: err.message })
        } finally {
            set({ isLoading: false })
        }
    },

    addAccount: async (accountData) => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('accounts')
                .insert([{ ...accountData, user_id: userData.user.id }])
                .select()
                .single()

            if (error) throw error

            const currentAccounts = get().accounts
            set({ accounts: [...currentAccounts, data as Account] })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    updateAccount: async (id, accountData) => {
        try {
            const { data, error } = await supabase
                .from('accounts')
                .update(accountData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            const currentAccounts = get().accounts
            set({ accounts: currentAccounts.map(a => a.id === id ? (data as Account) : a) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    deleteAccount: async (id) => {
        try {
            const { error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id)

            if (error) throw error

            const currentAccounts = get().accounts
            set({ accounts: currentAccounts.filter(a => a.id !== id) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    }
}))
