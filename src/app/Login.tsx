import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { WalletCards } from 'lucide-react'

export default function Login() {
    const { user } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    // If already logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isRegistering) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                // If session exists, user is auto-logged in (email confirmation disabled)
                if (data.session) {
                    navigate('/dashboard')
                } else {
                    // Email confirmation required
                    alert('Registro realizado! Verifique seu email para confirmar a conta.')
                    setIsRegistering(false)
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-none">
                <CardHeader className="space-y-3 items-center text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <WalletCards className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-serif text-primary-dark">
                        Suas Economias
                    </CardTitle>
                    <CardDescription>
                        {isRegistering
                            ? 'Crie sua conta para começar a gerenciar.'
                            : 'Entre com suas credenciais para acessar o painel.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark" disabled={loading}>
                            {loading ? 'Carregando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegistering(!isRegistering)
                            setError(null)
                        }}
                        className="text-sm text-primary hover:underline"
                    >
                        {isRegistering
                            ? 'Já tem uma conta? Faça login'
                            : 'Não tem uma conta? Cadastre-se'}
                    </button>
                </CardFooter>
            </Card>
        </div>
    )
}
