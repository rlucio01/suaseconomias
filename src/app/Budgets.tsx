import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useBudgetsStore } from '@/store/budgetsStore'
import { useCategoriesStore } from '@/store/categoriesStore'
import { useTransactionsStore } from '@/store/transactionsStore'
import { formatCurrency } from '@/lib/formatters'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function Budgets() {
    const { budgets, fetchBudgets, addBudget, deleteBudget, isLoading } = useBudgetsStore()
    const { categories, fetchCategories } = useCategoriesStore()
    const { transactions, fetchTransactions } = useTransactionsStore()

    const now = new Date()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())

    useEffect(() => {
        fetchBudgets(month, year)
        if (categories.length === 0) fetchCategories()
        const start = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
        const end = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
        fetchTransactions(start, end)
    }, [month, year, fetchBudgets, fetchCategories, fetchTransactions, categories.length])

    const spentByCategory = useMemo(() => {
        const map: Record<string, number> = {}
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                if (t.category_id) {
                    map[t.category_id] = (map[t.category_id] || 0) + Math.abs(Number(t.amount))
                }
            })
        return map
    }, [transactions])

    const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + (spentByCategory[b.category_id] || 0), 0)

    const expenseCategories = categories.filter(c => c.type === 'expense')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-dark">Orçamento</h2>
                    <p className="text-text-secondary mt-1">Planeje quanto gastar em cada categoria.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                    {new Date(2000, i).toLocaleDateString('pt-BR', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input type="number" className="w-[90px]" value={year} onChange={e => setYear(Number(e.target.value))} />
                    <AddBudgetDialog onAdd={addBudget} categories={expenseCategories} month={month} year={year} existingCategoryIds={budgets.map(b => b.category_id)} />
                </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Total Orçado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-expense">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Total Gasto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalSpent > totalBudgeted ? 'text-expense' : 'text-income'}`}>
                            {formatCurrency(totalSpent)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Items */}
            {isLoading ? (
                <div className="text-center p-8 text-text-secondary">Carregando orçamentos...</div>
            ) : budgets.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-lg bg-surface">
                    <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text mb-2">Nenhum orçamento definido</h3>
                    <p className="text-text-secondary mb-4">Defina limites de gastos por categoria para este mês.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {budgets.map(b => {
                        const cat = categories.find(c => c.id === b.category_id)
                        const spent = spentByCategory[b.category_id] || 0
                        const pct = b.amount > 0 ? Math.min(100, Math.round((spent / Number(b.amount)) * 100)) : 0
                        const isOver = spent > Number(b.amount)

                        return (
                            <Card key={b.id} className="shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-semibold text-text">{cat?.name || 'Categoria removida'}</h4>
                                            <p className="text-sm text-text-secondary">
                                                {formatCurrency(spent)} de {formatCurrency(b.amount)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${isOver ? 'text-expense' : 'text-income'}`}>
                                                {pct}%
                                            </span>
                                            <Button variant="ghost" size="icon" onClick={() => deleteBudget(b.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Progress value={pct} className={`h-2 ${isOver ? '[&>div]:bg-red-500' : ''}`} />
                                    {isOver && (
                                        <p className="text-xs text-expense mt-1">
                                            Acima do orçamento em {formatCurrency(spent - Number(b.amount))}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function AddBudgetDialog({ onAdd, categories, month, year, existingCategoryIds }: {
    onAdd: any; categories: any[]; month: number; year: number; existingCategoryIds: string[]
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categoryId, setCategoryId] = useState('')
    const [amount, setAmount] = useState('')

    const available = categories.filter(c => !existingCategoryIds.includes(c.id))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onAdd({ category_id: categoryId, month, year, amount: parseFloat(amount) })
            setOpen(false)
            setCategoryId('')
            setAmount('')
        } catch { alert('Erro ao salvar orçamento') }
        finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-5 h-5 mr-2" /> Adicionar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Novo Orçamento de Categoria</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                {available.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Valor Limite (R$)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R$</span>
                            <Input required type="number" step="0.01" min="1" className="pl-9" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                    </div>
                    <Button type="submit" disabled={loading || !categoryId} className="w-full bg-primary hover:bg-primary-dark">
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
