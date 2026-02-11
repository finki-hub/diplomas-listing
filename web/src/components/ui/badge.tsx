import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/cn';

export type BadgeProps = ComponentProps<'span'> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
};

export const Badge = (props: BadgeProps) => {
  const [local, rest] = splitProps(props, ['class', 'variant']);

  const variantClasses = () => {
    switch (local.variant) {
      case 'destructive':
        return 'border-transparent bg-destructive text-white';
      case 'outline':
        return 'text-foreground';
      case 'secondary':
        return 'border-transparent bg-secondary text-secondary-foreground';
      default:
        return 'border-transparent bg-primary text-primary-foreground';
    }
  };

  return (
    <span
      class={cn(
        'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden',
        variantClasses(),
        local.class,
      )}
      {...rest}
    />
  );
};
