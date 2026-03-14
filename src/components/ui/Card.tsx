import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean
}

export function Card({ glow, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`card ${glow ? 'border-indigo-400/40 shadow-[0_20px_48px_rgba(54,74,196,0.35)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
