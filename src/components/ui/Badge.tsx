import { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'purple' | 'green' | 'yellow' | 'red' | 'blue'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/12 border border-white/15 text-gray-300',
  purple: 'bg-indigo-500/16 border border-indigo-300/35 text-indigo-200',
  green: 'bg-emerald-500/16 border border-emerald-300/35 text-emerald-200',
  yellow: 'bg-amber-500/16 border border-amber-300/35 text-amber-200',
  red: 'bg-rose-500/16 border border-rose-300/35 text-rose-200',
  blue: 'bg-sky-500/16 border border-sky-300/35 text-sky-200',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
