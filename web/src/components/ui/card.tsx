import { type ComponentProps, splitProps } from 'solid-js';

import { cn } from '@/lib/cn';

export type CardProps = ComponentProps<'div'>;

export const Card = (props: CardProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        props.class,
      )}
      {...rest}
    />
  );
};

export type CardHeaderProps = ComponentProps<'div'>;

export const CardHeader = (props: CardHeaderProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6',
        props.class,
      )}
      {...rest}
    />
  );
};

export type CardTitleProps = ComponentProps<'div'>;

export const CardTitle = (props: CardTitleProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('leading-none font-semibold tracking-tight', props.class)}
      {...rest}
    />
  );
};

export type CardDescriptionProps = ComponentProps<'div'>;

export const CardDescription = (props: CardDescriptionProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('text-muted-foreground text-sm', props.class)}
      {...rest}
    />
  );
};

export type CardContentProps = ComponentProps<'div'>;

export const CardContent = (props: CardContentProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('px-6', props.class)}
      {...rest}
    />
  );
};

export type CardFooterProps = ComponentProps<'div'>;

export const CardFooter = (props: CardFooterProps) => {
  const [, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('flex items-center px-6', props.class)}
      {...rest}
    />
  );
};
