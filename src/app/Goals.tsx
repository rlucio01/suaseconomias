import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useGoalsStore } from '@/store/goalsStore'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Target } from 'lucide-react'

export default function Goals() {
    const { goals, fetchGoals, addGoal, deleteGoal, isLoading } = useGoalsStore()

    useEffect(() => {
        fetchGoals()
    }, [fetchGoals])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-dark">Sonhos e Metas</h2>
                    <p className="text-text-secondary mt-1">Acompanhe o progresso dos seus objetivos financeiros.</p>
                </div>
                <AddGoalDialog onAdd={addGoal} />
            </div>

            {isLoading ? (
                <div className="text-center p-8 text-text-secondary">Carregando metas...</div>
            ) : goals.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-lg bg-surface">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text mb-2">Nenhum sonho cadastrado</h3>
                    <p className="text-text-secondary mb-4">Que tal começar a planejar seu próximo objetivo?</p>
                    <AddGoalDialog onAdd={addGoal} />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {goals.map(goal => {
                        const progress = goal.target_amount > 0
                            ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                            : 0

                        return (
                            <Card key={goal.id} className="overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        {goal.target_date ? `Meta para: ${formatDate(goal.target_date)}` : 'Sem data definida'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {goal.description && (
                                        <p className="text-sm text-text-secondary mb-3">{goal.description}</p>
                                    )}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold text-primary-dark">{formatCurrency(goal.current_amount)}</span>
                                            <span className="text-text-secondary">de {formatCurrency(goal.target_amount)}</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                        <p className="text-right text-xs text-text-secondary font-medium">{progress}% concluído</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function AddGoalDialog({ onAdd }: { onAdd: any }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [currentAmount, setCurrentAmount] = useState('0')
    const [targetDate, setTargetDate] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onAdd({
                title,
                description: description || null,
                target_amount: parseFloat(targetAmount),
                current_amount: parseFloat(currentAmount || '0'),
                target_date: targetDate || null,
                image_url: null
            })
            setOpen(false)
            resetForm()
        } catch (error) {
            console.error('Error adding goal', error)
            alert('Erro ao salvar meta')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setTargetAmount('')
        setCurrentAmount('0')
        setTargetDate('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Sonho
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Planejar Novo Sonho</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>O que você quer alcançar?</Label>
                        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Viagem para Europa, Carro Novo" />
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes adicionais sobre o seu objetivo" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor Total (Objetivo)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R$</span>
                                <Input required type="number" step="0.01" min="1" className="pl-9" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0,00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Já guardou algum valor?</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R$</span>
                                <Input type="number" step="0.01" min="0" className="pl-9" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0,00" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Data Alvo (Opcional)</Label>
                        <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark mt-6">
                        {loading ? 'Salvando...' : 'Salvar Objetivo'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
