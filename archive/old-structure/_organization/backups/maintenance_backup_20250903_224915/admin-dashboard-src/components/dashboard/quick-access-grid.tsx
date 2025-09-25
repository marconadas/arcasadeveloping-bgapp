'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

interface QuickAccessLink {
  id: string
  title: string
  description: string
  url: string
  icon: string
  isExternal?: boolean
  isNew?: boolean
}

interface QuickAccessCategory {
  category: string
  links: QuickAccessLink[]
}

interface QuickAccessGridProps {
  categories: QuickAccessCategory[]
}

const iconMap: Record<string, string> = {
  'chart-line': '📊',
  'microscope': '🔬',
  'users': '👥',
  'map': '🗺️',
  'satellite-dish': '📡',
  'globe': '🌍',
  'mobile-alt': '📱',
  'heartbeat': '💓',
  'search': '🔍',
  'cogs': '⚙️',
  'database': '💾',
  'shield-alt': '🛡️',
  'fish': '🐟',
}

export function QuickAccessGrid({ categories }: QuickAccessGridProps) {
  const handleLinkClick = (link: QuickAccessLink) => {
    if (link.isExternal) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = link.url
    }
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category.category}>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {category.category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.links.map((link) => (
              <Button
                key={link.id}
                variant="outline"
                className="h-auto p-4 justify-start text-left hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handleLinkClick(link)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-2xl shrink-0">
                    {iconMap[link.icon] || '🔧'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {link.title}
                      </h4>
                      {link.isNew && (
                        <Badge variant="success" className="text-xs">
                          Novo
                        </Badge>
                      )}
                      {link.isExternal && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {link.description}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
