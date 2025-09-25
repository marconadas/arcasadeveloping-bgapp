'use client'

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { SystemMetrics } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

Chart.register(...registerables)

interface SystemPerformanceChartProps {
  data?: SystemMetrics
  loading?: boolean
}

export function SystemPerformanceChart({ data, loading }: SystemPerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || loading || !data) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Generate sample data for the last 24 hours
    const now = new Date()
    const labels = []
    const cpuData = []
    const memoryData = []
    const diskData = []

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      labels.push(time.toLocaleTimeString('pt-PT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }))
      
      // Generate realistic performance data
      cpuData.push(Math.random() * 30 + 20) // 20-50% CPU
      memoryData.push(Math.random() * 20 + 60) // 60-80% Memory
      diskData.push(Math.random() * 10 + 30) // 30-40% Disk
    }

    // Use current data for the last point if available
    if (data) {
      cpuData[cpuData.length - 1] = data.cpuPercent
      memoryData[memoryData.length - 1] = data.memoryPercent
      diskData[diskData.length - 1] = data.diskPercent
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'CPU (%)',
            data: cpuData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Memória (%)',
            data: memoryData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Disco (%)',
            data: diskData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Hora',
            },
            grid: {
              display: false,
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Utilização (%)',
            },
            min: 0,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart',
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, loading])

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  )
}
