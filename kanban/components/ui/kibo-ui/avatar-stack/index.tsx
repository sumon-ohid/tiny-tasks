import { cn } from '@/lib/utils';
import { Children, type ReactNode } from 'react';

export type AvatarStackProps = {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  size?: number;
};

export const AvatarStack = ({
  children,
  className,
  animate = false,
  size = 40,
  ...props
}: AvatarStackProps) => (
  <div
    className={cn(
      '-space-x-1 flex items-center',
      animate && 'hover:space-x-0 [&>*]:transition-all',
      className
    )}
    {...props}
  >
    {Children.map(children, (child, index) => (
      <div
        className={cn('shrink-0 overflow-hidden rounded-full', className)}
        style={{
          width: size,
          height: size,
          maskImage: index
            ? `radial-gradient(circle ${size / 2}px at -${size / 4 + size / 10}px 50%, transparent 99%, white 100%)`
            : '',
        }}
      >
        {child}
      </div>
    ))}
  </div>
);
