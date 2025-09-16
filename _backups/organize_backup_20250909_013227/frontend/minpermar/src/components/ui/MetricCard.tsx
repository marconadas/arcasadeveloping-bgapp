import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from './Card'
import { Badge } from './Badge'
import { cn } from '../../utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'red' | 'yellow'
  className?: string
}

const colorSchemes = {
  blue: {
    bg: 'from-ocean-blue-500 to-ocean-blue-600',
    text: 'text-ocean-blue-700',
    badge: 'bg-ocean-blue-100 text-ocean-blue-800'
  },
  green: {
    bg: 'from-ocean-green-500 to-ocean-green-600',
    text: 'text-ocean-green-700',
    badge: 'bg-ocean-green-100 text-ocean-green-800'
  },
  red: {
    bg: 'from-red-500 to-red-600',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800'
  },
  yellow: {
    bg: 'from-yellow-500 to-yellow-600',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800'
  }
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  trend = 'neutral',
  color = 'blue',
  className
}) => {
  const scheme = colorSchemes[color]
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString('pt-AO')
    }
    return val
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className={cn('relative overflow-hidden', className)} hover>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${scheme.bg}`} />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <motion.p
                className="text-3xl font-bold text-gray-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                {formatValue(value)}
              </motion.p>
              {change !== undefined && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon()}
                  <span className={cn(
                    'text-sm font-medium',
                    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
            {changeLabel && (
              <Badge variant="outline" size="sm" className="mt-2">
                {changeLabel}
              </Badge>
            )}
          </div>
          
          {icon && (
            <div className={`p-3 rounded-xl bg-gradient-to-r ${scheme.bg}`}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
