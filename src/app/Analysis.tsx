import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useTransactionsStore } from '@/store/transactionsStore'
import { useCategoriesStore } from '@/store/categoriesStore'
import { useAccountsStore } from '@/store/accountsStore'
import { formatCurrency } from '@/lib/formatters'
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Download } from 'lucide-react'

export default function Analysis() {
    const { transactions, fetchTransactions } = useTransactionsStore()
    const { categories, fetchCategories } = useCategoriesStore()
    const { accounts } = useAccountsStore()

    const now = new Date()
    const [months, setMonths] = useState(6)

    useEffect(() => {
        const start = format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd')
        const end = format(endOfMonth(now), 'yyyy-MM-dd')
        fetchTransactions(start, end)
        if (categories.length === 0) fetchCategories()
    }, [months]) // eslint-disable-line

    // Monthly income vs expense bar chart data
    const monthlyData = useMemo(() => {
        const interval = eachMonthOfInterval({
            start: subMonths(now, months - 1),
            end: now
        })
        return interval.map(monthDate => {
            const mStart = startOfMonth(monthDate)
            const mEnd = endOfMonth(monthDate)
            const monthTx = transactions.filter(t => {
                const d = new Date(t.date)
                return d >= mStart && d <= mEnd
            })
            const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
            const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
            return {
                month: format(monthDate, 'MMM yy', { locale: ptBR }),
                Entradas: income,
                Saídas: expense,
                Saldo: income - expense
            }
        })
    }, [transactions, months])

    // Category breakdown
    const categoryData = useMemo(() => {
        const grouped: Record<string, { name: string; value: number; color: string }> = {}
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = categories.find(c => c.id === t.category_id)
            const name = cat?.name || 'Outros'
            const color = cat?.color || '#94a3b8'
            if (!grouped[name]) grouped[name] = { name, value: 0, color }
            grouped[name].value += Math.abs(Number(t.amount))
        })
        return Object.values(grouped).sort((a, b) => b.value - a.value)
    }, [transactions, categories])

    const COLORS = ['#3a7d2c', '#2e7d32', '#1565c0', '#e65100', '#6a1b9a', '#c62828', '#00838f', '#ef6c00', '#4527a0', '#2e7d32']

    // Export to CSV
    const exportCSV = () => {
        const header = 'Data,Descrição,Tipo,Valor,Categoria,Conta\n'
        const rows = transactions.map(t => {
            const cat = categories.find(c => c.id === t.category_id)
            const acc = accounts.find(a => a.id === t.account_id)
            return `${t.date},"${t.description}",${t.type},${t.amount},"${cat?.name || ''}","${acc?.name || ''}"`
        }).join('\n')

        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transacoes_${format(now, 'yyyy-MM-dd')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-dark">Análise</h2>
                    <p className="text-text-secondary mt-1">Relatórios e gráficos dos seus dados financeiros.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Select value={String(months)} onValueChange={v => setMonths(Number(v))}>
                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">Últimos 3 meses</SelectItem>
                            <SelectItem value="6">Últimos 6 meses</SelectItem>
                            <SelectItem value="12">Último ano</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportCSV}>
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Income vs Expense Bar Chart */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Entradas vs Saídas</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Legend />
                            <Bar dataKey="Entradas" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Saídas" fill="#c62828" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Balance Trend Line */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Evolução do Saldo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Line type="monotone" dataKey="Saldo" stroke="#3a7d2c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Pie */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                                        {categoryData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-secondary">Sem dados no período.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
