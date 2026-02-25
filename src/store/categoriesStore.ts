import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Category {
    id: string
    user_id: string
    name: string
    parent_id: string | null
    type: 'expense' | 'income' | 'transfer'
    color: string | null
    icon: string | null
}

interface CategoriesState {
    categories: Category[]
    isLoading: boolean
    error: string | null
    fetchCategories: () => Promise<void>
    addCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<void>
    updateCategory: (id: string, category: Partial<Category>) => Promise<void>
    deleteCategory: (id: string) => Promise<void>
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
        set({ isLoading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name')

            if (error) throw error
            set({ categories: data as Category[] })
        } catch (err: any) {
            set({ error: err.message })
        } finally {
            set({ isLoading: false })
        }
    },

    addCategory: async (categoryData) => {
        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('categories')
                .insert([{ ...categoryData, user_id: userData.user.id }])
                .select()
                .single()

            if (error) throw error

            const currentCategories = get().categories
            set({ categories: [...currentCategories, data as Category] })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(categoryData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            const currentCategories = get().categories
            set({ categories: currentCategories.map(c => c.id === id ? (data as Category) : c) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    },

    deleteCategory: async (id) => {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id)

            if (error) throw error

            const currentCategories = get().categories
            set({ categories: currentCategories.filter(c => c.id !== id) })
        } catch (err: any) {
            set({ error: err.message })
            throw err
        }
    }
}))
