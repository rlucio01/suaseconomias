import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccountsStore } from '@/store/accountsStore'
import { useTransactionsStore } from '@/store/transactionsStore'
import { useCategoriesStore } from '@/store/categoriesStore'
import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/formatters'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function Dashboard() {
    const { accounts } = useAccountsStore()
    const { transactions, fetchTransactions, addTransaction, currentMonth } = useTransactionsStore()
    const { categories, fetchCategories } = useCategoriesStore()

    useEffect(() => {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
        fetchTransactions(start, end)
        if (categories.length === 0) fetchCategories()
    }, [currentMonth, fetchTransactions, fetchCategories, categories.length])

    const totalBalance = accounts.reduce((acc, current) => acc + Number(current.balance), 0)

    const { income, expense } = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            if (curr.type === 'income') return { ...acc, income: acc.income + Number(curr.amount) }
            if (curr.type === 'expense') return { ...acc, expense: acc.expense + Number(Math.abs(curr.amount)) }
            return acc
        }, { income: 0, expense: 0 })
    }, [transactions])

    const expensesByCategory = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense')
        const grouped = expenses.reduce((acc, curr) => {
            const cat = categories.find(c => c.id === curr.category_id)
            const catName = cat ? cat.name : 'Outros'
            const color = cat && cat.color ? cat.color : '#94a3b8'

            if (!acc[catName]) {
                acc[catName] = { name: catName, value: 0, color }
            }
            acc[catName].value += Number(Math.abs(curr.amount))
            return acc
        }, {} as Record<string, { name: string, value: number, color: string }>)

        return Object.values(grouped).sort((a, b) => b.value - a.value)
    }, [transactions, categories])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-dark">Visão Geral</h2>
                <div className="flex items-center gap-3">
                    <QuickAddTransactionDialog onAdd={addTransaction} accounts={accounts} categories={categories} />
                    <span className="text-text-secondary font-medium">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-sm border-l-4 border-l-primary/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Saldo Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalBalance < 0 ? 'text-expense' : ''}`}>
                            {formatCurrency(totalBalance)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-income">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Entradas (Mês)</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-income" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-income">{formatCurrency(income)}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-expense">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">Saídas (Mês)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-expense" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-expense">{formatCurrency(expense)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        {expensesByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expensesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-secondary border-t border-slate-200 dark:border-slate-800">
                                Sem despesas registradas no mês.
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Últimas Transações</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72 overflow-y-auto border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                        {transactions.length > 0 ? (
                            transactions.slice(0, 5).map(t => (
                                <div key={t.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium text-text">{t.description}</p>
                                        <p className="text-xs text-text-secondary">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <span className={`font-semibold ${t.type === 'expense' ? 'text-expense' : t.type === 'income' ? 'text-income' : 'text-text'}`}>
                                        {t.type === 'expense' ? '- ' : t.type === 'income' ? '+ ' : ''}
                                        {formatCurrency(t.amount)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-secondary">
                                Nenhuma transação recente.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function QuickAddTransactionDialog({ onAdd, accounts, categories }: { onAdd: any, accounts: any[], categories: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState('expense')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [accountId, setAccountId] = useState('')
    const [categoryId, setCategoryId] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accountId) return alert('Selecione uma conta')
        setLoading(true)
        try {
            await onAdd({
                type, description, amount: parseFloat(amount), date,
                account_id: accountId, category_id: categoryId || null,
                is_consolidated: true, is_recurring: false, recurrence_rule: null,
                recurrence_group_id: null, installment_current: null, installment_total: null,
                notes: null, attachment_url: null, transfer_peer_id: null
            })
            setOpen(false)
            setDescription(''); setAmount(''); setCategoryId('')
            setDate(format(new Date(), 'yyyy-MM-dd'))
        } catch { alert('Erro ao salvar transação') }
        finally { setLoading(false) }
    }

    const filteredCategories = categories.filter((c: any) => c.type === type)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-4 h-4 mr-1" /> Nova Transação
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Transação Rápida</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="grid grid-cols-3 gap-2">
                        <Button type="button" variant={type === 'expense' ? 'default' : 'outline'}
                            className={type === 'expense' ? 'bg-expense hover:bg-red-700' : ''}
                            onClick={() => setType('expense')}>Despesa</Button>
                        <Button type="button" variant={type === 'income' ? 'default' : 'outline'}
                            className={type === 'income' ? 'bg-income hover:bg-green-700 border-none text-white' : ''}
                            onClick={() => setType('income')}>Receita</Button>
                        <Button type="button" variant={type === 'transfer' ? 'default' : 'outline'}
                            className={type === 'transfer' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                            onClick={() => setType('transfer')}>Transferência</Button>
                    </div>
                    <div className="space-y-2">
                        <Label>Valor</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R$</span>
                            <Input required type="number" step="0.01" min="0" className="pl-9 text-lg font-medium"
                                value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Mercado, Salário" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Conta</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {type !== 'transfer' && (
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                <SelectContent>
                                    {filteredCategories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark">
                        {loading ? 'Salvando...' : 'Salvar Lançamento'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
