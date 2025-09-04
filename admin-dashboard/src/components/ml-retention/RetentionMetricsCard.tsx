/**
 * 📊 Retention Metrics Card Component
 * Componente reutilizável para métricas do sistema de retenção
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Database, 
  Activity, 
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  type: 'cache' | 'performance' | 'storage' | 'health';
  status?: 'good' | 'warning' | 'critical';
  progress?: number;
  badge?: string;
}

const RetentionMetricsCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
  trendValue,
  type,
  status = 'good',
  progress,
  badge
}) => {
  const getIcon = () => {
    switch (type) {
      case 'cache':
        return <Zap className="h-4 w-4 text-muted-foreground" />;
      case 'performance':
        return <Activity className="h-4 w-4 text-muted-foreground" />;
      case 'storage':
        return <HardDrive className="h-4 w-4 text-muted-foreground" />;
      case 'health':
        return status === 'good' ? 
          <CheckCircle className="h-4 w-4 text-green-600" /> :
          <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = () => {
    if (!progress) return undefined;
    
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && trendValue && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {progress !== undefined && (
          <div className="mt-2">
            <Progress 
              value={progress} 
              className="h-2"
            />
          </div>
        )}
        
        {description && (
          <p className={`text-xs mt-2 ${getStatusColor()}`}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RetentionMetricsCard;
