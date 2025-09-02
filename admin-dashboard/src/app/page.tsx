'use client'

import { useState } from 'react'
import { SidebarSSRSafeFixed } from '@/components/layout/sidebar-ssr-safe-fixed'
import { Header } from '@/components/layout/header'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState('dashboard')

  return (
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
        <SidebarSSRSafeFixed 
          activeSection={currentSection}
          onSectionChange={setCurrentSection}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            currentSection={currentSection}
          />

          {/* Dashboard content */}
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
            <DashboardContent section={currentSection} />
          </main>
        </div>
      </div>
    </div>
  )
}