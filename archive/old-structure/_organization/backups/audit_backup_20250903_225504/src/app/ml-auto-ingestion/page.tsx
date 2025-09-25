'use client'

import { useState } from 'react'
import { SidebarStaticSiliconValley } from '@/components/layout/sidebar-static-silicon-valley'
import { Header } from '@/components/layout/header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { cn } from '@/lib/utils'
import { ErrorBoundarySiliconValley } from '@/components/error-boundary-silicon-valley'
import '@/lib/url-replacer-silicon-valley'

export default function MLAutoIngestionPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentSection = 'ml-auto-ingestion'

  return (
    <ErrorBoundarySiliconValley showDetails={true}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Mobile overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setSidebarOpen(false)}
        />

        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <ErrorBoundarySiliconValley>
            <SidebarStaticSiliconValley 
              activeSection={currentSection}
              onSectionChange={() => {}}
            />
          </ErrorBoundarySiliconValley>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <ErrorBoundarySiliconValley>
              <Header 
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                currentSection={currentSection}
              />
            </ErrorBoundarySiliconValley>

            {/* Dashboard content */}
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
              <ErrorBoundarySiliconValley>
                <DashboardContent section={currentSection} />
              </ErrorBoundarySiliconValley>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundarySiliconValley>
  )
}
