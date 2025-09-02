import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
  size?: 'sm' | 'default' | 'lg'
  children: React.ReactNode
}

const badgeVariants = {
  default: 'bg-ocean-blue-100 text-ocean-blue-800 border-ocean-blue-200',
  secondary: 'bg-gray-100 text-gray-800 border-gray-200',
  destructive: 'bg-red-100 text-red-800 border-red-200',
  outline: 'border-2 border-ocean-blue-700 text-ocean-blue-700',
  success: 'bg-ocean-green-100 text-ocean-green-800 border-ocean-green-200'
}

const badgeSizes = {
  sm: 'px-2 py-1 text-xs',
  default: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium border transition-all duration-200',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
