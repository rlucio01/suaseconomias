import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onConfirm: () => void
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default'
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm()
                            onOpenChange(false)
                        }}
                        className={variant === 'default' ? 'bg-primary hover:bg-primary-dark' : ''}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Hook for easier usage
export function useConfirmDialog() {
    const [state, setState] = useState<{
        open: boolean
        title: string
        description: string
        onConfirm: () => void
        variant?: 'destructive' | 'default'
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: () => { },
        variant: 'default'
    })

    const confirm = (options: {
        title: string
        description: string
        onConfirm: () => void
        variant?: 'destructive' | 'default'
    }) => {
        setState({ ...options, open: true })
    }

    const dialogProps = {
        ...state,
        onOpenChange: (open: boolean) => setState(prev => ({ ...prev, open }))
    }

    return { confirm, dialogProps }
}
