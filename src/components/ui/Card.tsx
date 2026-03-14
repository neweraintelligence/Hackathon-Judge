import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ glow, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl p-6 border border-white/[0.06] ${glow ? 'shadow-glow border-purple-500/30' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
