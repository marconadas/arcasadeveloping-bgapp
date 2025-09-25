import { EnhancedSTACInterface } from '@/components/stac/enhanced-stac-interface'
import { STACErrorBoundary } from '@/components/stac/stac-error-boundary'

export default function STACEnhancedPage() {
  return (
    <STACErrorBoundary>
      <EnhancedSTACInterface />
    </STACErrorBoundary>
  )
}
