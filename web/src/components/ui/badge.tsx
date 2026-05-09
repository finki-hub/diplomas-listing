import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/cn';

export type BadgeProps = ComponentProps<'span'> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
};

const variantClassNames = {
  default: 'border-transparent bg-primary text-primary-foreground',
  destructive: 'border-transparent bg-destructive text-white',
  outline: 'text-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
} satisfies Record<NonNullable<BadgeProps['variant']>, string>;

export const Badge = (props: BadgeProps) => {
  const [local, rest] = splitProps(props, ['class', 'variant']);

  const variantClasses = () => variantClassNames[local.variant ?? 'default'];

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
