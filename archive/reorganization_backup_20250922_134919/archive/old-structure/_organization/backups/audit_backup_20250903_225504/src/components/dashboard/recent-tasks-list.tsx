'use client'

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'

export function RecentTasksList() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['async-tasks'],
    queryFn: api.getAsyncTasks,
    refetchInterval: 10000, // 10 seconds
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    )
  }

  const recentTasks = tasks?.slice(0, 8) || []

  if (recentTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="space-y-2">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nenhuma tarefa recente
          </p>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Loader className="h-4 w-4 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'retry':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'failure':
        return 'destructive'
      case 'running':
        return 'info'
      case 'pending':
        return 'warning'
      case 'retry':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-2">
      {recentTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
        >
          <div className="shrink-0">
            {getStatusIcon(task.status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {task.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {task.queueName}
              </p>
              {task.startTime && (
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(task.startTime)}
                </p>
              )}
            </div>
          </div>
          
          <div className="shrink-0">
            <Badge 
              variant={getStatusBadgeVariant(task.status) as any}
              className="text-xs"
            >
              {task.status}
            </Badge>
          </div>
        </div>
      ))}
      
      {recentTasks.length >= 8 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Mostrando as 8 tarefas mais recentes
          </p>
        </div>
      )}
    </div>
  )
}
