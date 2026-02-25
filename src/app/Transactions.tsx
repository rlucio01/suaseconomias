import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransactionsStore } from '@/store/transactionsStore'
import { useAccountsStore } from '@/store/accountsStore'
import { useCategoriesStore } from '@/store/categoriesStore'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfMonth, endOfMonth, format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Transactions() {
    const { currentMonth, setCurrentMonth, transactions, fetchTransactions, addTransaction, deleteTransaction, isLoading } = useTransactionsStore()
    const { accounts, fetchAccounts } = useAccountsStore()
    const { categories, fetchCategories } = useCategoriesStore()

    useEffect(() => {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
        fetchTransactions(start, end)
        if (accounts.length === 0) fetchAccounts()
        if (categories.length === 0) fetchCategories()
    }, [currentMonth, fetchTransactions, fetchAccounts, fetchCategories])

    const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || 'Sem categoria'
    const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Conta não encontrada'

    const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-dark">Transações</h2>
                <div className="flex items-center gap-2">
                    {/* Month Navigation */}
                    <Button variant="outline" size="icon" onClick={goToPrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm font-semibold min-w-[120px] text-center capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}><ChevronRight className="w-4 h-4" /></Button>

                    <AddTransactionDialog
                        onAdd={addTransaction}
                        accounts={accounts}
                        categories={categories}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center p-8 text-text-secondary">Carregando transações...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center p-12 border-2 border-dashed rounded-lg text-text-secondary">
                            Nenhuma transação encontrada neste período.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg bg-surface hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-income/20 text-income' :
                                            t.type === 'expense' ? 'bg-expense/20 text-expense' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> :
                                                t.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> :
                                                    <ArrowRightLeft className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text">{t.description}</p>
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                {formatDate(t.date)} • {getAccountName(t.account_id)} • {getCategoryName(t.category_id)}
                                                {t.is_recurring && ' • 🔄 Recorrente'}
                                                {t.installment_total && t.installment_total > 1 && ` • ${t.installment_current}/${t.installment_total}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-medium whitespace-nowrap ${t.type === 'expense' ? 'text-expense' : t.type === 'income' ? 'text-income' : 'text-text'}`}>
                                            {t.type === 'expense' ? '- ' : t.type === 'income' ? '+ ' : ''}
                                            {formatCurrency(t.amount)}
                                        </span>
                                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive hidden sm:flex">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function AddTransactionDialog({ onAdd, accounts, categories }: { onAdd: any, accounts: any[], categories: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState('expense')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [accountId, setAccountId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceRule, setRecurrenceRule] = useState('monthly')
    const [isInstallment, setIsInstallment] = useState(false)
    const [installmentTotal, setInstallmentTotal] = useState('2')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accountId) return alert('Selecione uma conta')

        setLoading(true)
        try {
            await onAdd({
                type,
                description,
                amount: parseFloat(amount),
                date,
                account_id: accountId,
                category_id: categoryId || null,
                is_consolidated: true,
                is_recurring: isRecurring,
                recurrence_rule: isRecurring ? recurrenceRule : null,
                recurrence_group_id: null,
                installment_current: isInstallment ? 1 : null,
                installment_total: isInstallment ? parseInt(installmentTotal) : null,
                notes: null,
                attachment_url: null,
                transfer_peer_id: null
            })
            setOpen(false)
            resetForm()
        } catch (error) {
            console.error('Error adding transaction', error)
            alert('Erro ao salvar transação')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setDescription('')
        setAmount('')
        setDate(format(new Date(), 'yyyy-MM-dd'))
        setCategoryId('')
        setIsRecurring(false)
        setIsInstallment(false)
        setInstallmentTotal('2')
    }

    const filteredCategories = categories.filter((c: any) => c.type === type)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Transação
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">

                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            type="button"
                            variant={type === 'expense' ? 'default' : 'outline'}
                            className={type === 'expense' ? 'bg-expense hover:bg-red-700' : ''}
                            onClick={() => setType('expense')}
                        >
                            Despesa
                        </Button>
                        <Button
                            type="button"
                            variant={type === 'income' ? 'default' : 'outline'}
                            className={type === 'income' ? 'bg-income hover:bg-green-700 border-none text-white' : ''}
                            onClick={() => setType('income')}
                        >
                            Receita
                        </Button>
                        <Button
                            type="button"
                            variant={type === 'transfer' ? 'default' : 'outline'}
                            className={type === 'transfer' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                            onClick={() => setType('transfer')}
                        >
                            Transferência
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Valor do Lançamento</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R$</span>
                            <Input
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-9 text-lg font-medium"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Mercado, Conta de Luz" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Conta</Label>
                            <Select value={accountId} onValueChange={setAccountId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc: any) => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {type !== 'transfer' && (
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione (Opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredCategories.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Recurring toggle */}
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                        <Checkbox
                            id="recurring"
                            checked={isRecurring}
                            onCheckedChange={(checked) => {
                                setIsRecurring(checked as boolean)
                                if (checked) setIsInstallment(false)
                            }}
                        />
                        <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">Transação recorrente</Label>
                    </div>
                    {isRecurring && (
                        <div className="space-y-2 pl-7">
                            <Label>Frequência</Label>
                            <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Installment toggle */}
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="installment"
                            checked={isInstallment}
                            onCheckedChange={(checked) => {
                                setIsInstallment(checked as boolean)
                                if (checked) setIsRecurring(false)
                            }}
                        />
                        <Label htmlFor="installment" className="text-sm font-normal cursor-pointer">Parcelado</Label>
                    </div>
                    {isInstallment && (
                        <div className="space-y-2 pl-7">
                            <Label>Número de Parcelas</Label>
                            <Input type="number" min="2" max="48" value={installmentTotal} onChange={e => setInstallmentTotal(e.target.value)} />
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark mt-6">
                        {loading ? 'Salvando...' : 'Salvar Lançamento'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
