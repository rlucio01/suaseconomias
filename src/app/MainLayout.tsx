import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { WalletCards, LogOut, LayoutDashboard, ArrowLeftRight, Target, PieChart, Settings, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useAccountsStore } from '@/store/accountsStore'
import { formatCurrency } from '@/lib/formatters'

export default function MainLayout() {
    const { user, isLoading: authLoading } = useAuthStore()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { accounts, fetchAccounts, isLoading: accountsLoading } = useAccountsStore()

    useEffect(() => {
        if (user) {
            fetchAccounts()
        }
    }, [user, fetchAccounts])

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    const totalBalance = accounts.reduce((acc, current) => acc + Number(current.balance), 0)

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            {/* Navbar TOP */}
            <header className="h-16 bg-primary-dark text-white flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1">
                        <Menu className="w-6 h-6" />
                    </button>
                    <WalletCards className="w-6 h-6 hidden sm:block" />
                    <h1 className="text-xl font-serif font-semibold tracking-wide">Suas Economias</h1>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm hidden sm:block opacity-90">{user.email}</span>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/20 hover:text-white" title="Sair">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Esquerda */}
                <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 
          fixed lg:static inset-y-0 left-0 z-20 w-64 bg-surface border-r shadow-sm transition-transform duration-300 ease-in-out flex flex-col h-[calc(100vh-4rem)] top-16
        `}>
                    <div className="p-4 flex-1 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Menu Principal</h3>
                        <nav className="space-y-1 mb-8">
                            <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Início" />
                            <SidebarLink to="/transactions" icon={<ArrowLeftRight size={18} />} label="Transações" />
                            <SidebarLink to="/goals" icon={<Target size={18} />} label="Sonhos" />
                            <SidebarLink to="/budget" icon={<PieChart size={18} />} label="Orçamento" />
                            <SidebarLink to="/analysis" icon={<PieChart size={18} />} label="Análise" />
                            <SidebarLink to="/settings" icon={<Settings size={18} />} label="Configurações" />
                        </nav>

                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Minhas Contas</h3>
                            <NavLink to="/settings" className="text-xs text-primary hover:underline" title="Gerenciar Contas">Ver todas</NavLink>
                        </div>

                        <div className="space-y-1 mb-4">
                            {accountsLoading ? (
                                <div className="text-sm text-text-secondary p-2">Carregando...</div>
                            ) : accounts.length === 0 ? (
                                <div className="text-sm text-text-secondary p-2">Nenhuma conta cadastrada.</div>
                            ) : (
                                accounts.map(account => (
                                    <div key={account.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 group cursor-default">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: account.color || '#ccc' }}
                                            />
                                            <span className="text-sm text-text truncate group-hover:text-primary-dark transition-colors" title={account.name}>
                                                {account.name}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-medium ${account.balance < 0 ? 'text-expense' : 'text-text'}`}>
                                            {formatCurrency(account.balance)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Saldo Total */}
                        {!accountsLoading && accounts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between p-2 bg-primary-light/50 rounded-md">
                                    <span className="text-sm font-semibold text-primary-dark">Saldo Total</span>
                                    <span className={`text-sm font-bold ${totalBalance < 0 ? 'text-expense' : 'text-primary-dark'}`}>
                                        {formatCurrency(totalBalance)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Overlay para fechar sidebar no mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-10 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Conteúdo Principal */}
                <main className="flex-1 overflow-y-auto bg-bg p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

function SidebarLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-text hover:bg-primary-light hover:text-primary-dark'
                }`
            }
        >
            {icon}
            <span className="font-medium">{label}</span>
        </NavLink>
    )
}
