import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccountsStore } from '@/store/accountsStore'
import { useCategoriesStore } from '@/store/categoriesStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save, KeyRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export default function Settings() {
    const { accounts, fetchAccounts, addAccount, deleteAccount } = useAccountsStore()
    const { categories, fetchCategories, addCategory, deleteCategory } = useCategoriesStore()

    useEffect(() => {
        fetchAccounts()
        fetchCategories()
    }, [fetchAccounts, fetchCategories])

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-dark">Configurações</h2>

            <Tabs defaultValue="accounts" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="accounts">Contas</TabsTrigger>
                    <TabsTrigger value="categories">Categorias</TabsTrigger>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                </TabsList>

                <TabsContent value="accounts" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Contas Bancárias</CardTitle>
                                <CardDescription>Gerencie suas contas, carteiras e corretoras.</CardDescription>
                            </div>
                            <AddAccountDialog onAdd={addAccount} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between p-4 border rounded-lg bg-surface hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: acc.color || '#ccc' }} />
                                            <div>
                                                <p className="font-semibold text-text">{acc.name}</p>
                                                <p className="text-sm text-text-secondary capitalize">{acc.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-medium ${acc.balance < 0 ? 'text-expense' : ''}`}>
                                                {formatCurrency(acc.balance)}
                                            </span>
                                            <Button variant="ghost" size="icon" onClick={() => deleteAccount(acc.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {accounts.length === 0 && (
                                    <div className="text-center p-6 text-text-secondary border rounded-lg border-dashed">
                                        Nenhuma conta cadastrada ainda.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Categorias</CardTitle>
                                <CardDescription>Organize seus lançamentos por categorias.</CardDescription>
                            </div>
                            <AddCategoryDialog onAdd={addCategory} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-4 border rounded-lg bg-surface">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }} />
                                            <div>
                                                <p className="font-semibold text-text">{cat.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${cat.type === 'income' ? 'bg-income/10 text-income' :
                                                cat.type === 'expense' ? 'bg-expense/10 text-expense' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {cat.type}
                                            </span>
                                            <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <div className="text-center p-6 text-text-secondary border rounded-lg border-dashed">
                                        Nenhuma categoria cadastrada ainda.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                    <ProfileSection />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function AddAccountDialog({ onAdd }: { onAdd: any }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [type, setType] = useState('checking')
    const [color, setColor] = useState('#3a7d2c')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onAdd({ name, type, color, balance: 0, is_active: true, icon: null })
        setOpen(false)
        setName('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conta
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Conta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome da Conta</Label>
                        <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: NuBank, Carteira" />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="checking">Conta Corrente</SelectItem>
                                <SelectItem value="savings">Poupança</SelectItem>
                                <SelectItem value="investment">Investimento</SelectItem>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Cor de Identificação</Label>
                        <div className="flex gap-2">
                            <Input type="color" className="w-16 h-10 p-1" value={color} onChange={e => setColor(e.target.value)} />
                            <Input readOnly value={color} className="flex-1" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">Salvar Conta</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function AddCategoryDialog({ onAdd }: { onAdd: any }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [type, setType] = useState('expense')
    const [color, setColor] = useState('#c62828')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onAdd({ name, type, color, parent_id: null, icon: null })
        setOpen(false)
        setName('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alimentação, Salário" />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={type} onValueChange={(val) => {
                            setType(val)
                            if (val === 'income' && color === '#c62828') setColor('#2e7d32')
                            if (val === 'expense' && color === '#2e7d32') setColor('#c62828')
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Despesa</SelectItem>
                                <SelectItem value="income">Receita</SelectItem>
                                <SelectItem value="transfer">Transferência</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex gap-2">
                            <Input type="color" className="w-16 h-10 p-1" value={color} onChange={e => setColor(e.target.value)} />
                            <Input readOnly value={color} className="flex-1" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">Salvar Categoria</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ProfileSection() {
    const { user } = useAuthStore()
    const [fullName, setFullName] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            supabase.from('profiles').select('full_name').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data?.full_name) setFullName(data.full_name)
                })
        }
    }, [user])

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        try {
            const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err: any) {
            alert('Erro ao salvar perfil: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordMsg(null)
        if (newPassword.length < 6) {
            setPasswordMsg('A senha deve ter pelo menos 6 caracteres.')
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordMsg('As senhas não coincidem.')
            return
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setPasswordMsg('Senha atualizada com sucesso!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setPasswordMsg('Erro: ' + err.message)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Perfil do Usuário</CardTitle>
                    <CardDescription>Gerencie suas informações pessoais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user?.email || ''} disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <div className="flex gap-2">
                            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
                            <Button onClick={handleSaveProfile} disabled={saving} className="bg-primary hover:bg-primary-dark">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar'}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <Label className="text-text-secondary">Conta criada em</Label>
                        <p>{new Date(user?.created_at || '').toLocaleDateString('pt-BR')}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Alterar Senha</CardTitle>
                    <CardDescription>Defina uma nova senha de acesso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Nova Senha</Label>
                            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required />
                        </div>
                        {passwordMsg && (
                            <p className={`text-sm ${passwordMsg.startsWith('Erro') || passwordMsg.startsWith('As') || passwordMsg.startsWith('A senha') ? 'text-expense' : 'text-income'}`}>
                                {passwordMsg}
                            </p>
                        )}
                        <Button type="submit" variant="outline">Alterar Senha</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
