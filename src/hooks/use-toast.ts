"use client"

import { toast as sonnerToast } from "sonner"
import { useCallback } from "react"

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "destructive" | "success"
  duration?: number
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, action, variant = "default", duration = 5000 }: ToastProps) => {
      const id = sonnerToast(title as string, {
        description,
        duration,
        action: action
          ? {
              label: action.label,
              onClick: action.onClick,
            }
          : undefined,
        className: variant === "destructive" 
          ? "bg-destructive text-destructive-foreground" 
          : variant === "success"
          ? "bg-green-500 text-white"
          : undefined,
      })

      return {
        id,
        dismiss: () => sonnerToast.dismiss(id),
        update: (props: Partial<ToastProps>) => {
          sonnerToast.dismiss(id)
          return toast({
            title: props.title ?? title,
            description: props.description ?? description,
            action: props.action ?? action,
            variant: props.variant ?? variant,
            duration: props.duration ?? duration,
          })
        },
      }
    },
    []
  )

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      sonnerToast.dismiss(toastId)
    } else {
      sonnerToast.dismiss()
    }
  }, [])

  return {
    toast,
    dismiss,
  }
}

// For direct usage without the hook
export const toast = ({
  title,
  description,
  action,
  variant = "default",
  duration = 5000,
}: ToastProps) => {
  const id = sonnerToast(title as string, {
    description,
    duration,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    className: variant === "destructive" 
      ? "bg-destructive text-destructive-foreground" 
      : variant === "success"
      ? "bg-green-500 text-white"
      : undefined,
  })

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: Partial<ToastProps>) => {
      sonnerToast.dismiss(id)
      return toast({
        title: props.title ?? title,
        description: props.description ?? description,
        action: props.action ?? action,
        variant: props.variant ?? variant,
        duration: props.duration ?? duration,
      })
    },
  }
}
