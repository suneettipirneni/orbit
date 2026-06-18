import { cn } from '@orbit/ui';
import { ComponentProps } from 'react';

export function PageLayoutHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={cn('')} />
  )
}

export function PageLayout(props: ComponentProps<'div'>) {
  
}