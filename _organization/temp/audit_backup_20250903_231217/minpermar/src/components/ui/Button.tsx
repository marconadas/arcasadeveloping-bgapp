import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  children: React.ReactNode
}

const buttonVariants = {
  default: 'bg-ocean-blue-700 text-white hover:bg-ocean-blue-800 shadow-lg hover:shadow-xl',
  destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl',
  outline: 'border-2 border-ocean-blue-700 text-ocean-blue-700 hover:bg-ocean-blue-700 hover:text-white',
  secondary: 'bg-ocean-green-600 text-white hover:bg-ocean-green-700 shadow-lg hover:shadow-xl',
  ghost: 'hover:bg-ocean-blue-50 hover:text-ocean-blue-700',
  link: 'text-ocean-blue-700 underline-offset-4 hover:underline'
}

const buttonSizes = {
  default: 'h-12 px-6 py-3 text-base',
  sm: 'h-9 px-4 py-2 text-sm',
  lg: 'h-14 px-8 py-4 text-lg',
  icon: 'h-10 w-10'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ocean-blue-500 focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'transform hover:scale-105 active:scale-95',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...(props as any)}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
