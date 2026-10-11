import { Toaster as Sonner } from 'solid-sonner';

import { theme } from '@/components/ThemeToggle.tsx';
import { useLanguage } from '@/lib/LanguageProvider';

export const Toaster = (props: Parameters<typeof Sonner>[0]) => {
  const { t } = useLanguage();
  return (
    <Sonner
      class="toaster group"
      containerAriaLabel={t().notifications}
      richColors
      theme={theme()}
      toastOptions={{
        classes: {
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          description: 'group-[.toast]:text-muted-foreground',
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        },
        closeButtonAriaLabel: t().closeNotification,
      }}
      {...props}
    />
  );
};
