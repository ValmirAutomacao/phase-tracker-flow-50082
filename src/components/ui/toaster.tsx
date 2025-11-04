import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  const getToastClass = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return 'feedback-error animate-fadeInUp';
      case 'success':
        return 'feedback-success animate-fadeInUp';
      case 'warning':
        return 'feedback-warning animate-fadeInUp';
      default:
        return 'feedback-info animate-fadeInUp';
    }
  };

  return (
    <ToastProvider>
      {toasts?.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} className={`${getToastClass(variant || 'default')} ${props.className || ''}`}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
