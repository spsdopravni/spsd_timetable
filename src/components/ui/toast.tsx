// Simplified toast types without radix-ui dependencies
export type ToastActionElement = React.ReactElement<any>

export type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
