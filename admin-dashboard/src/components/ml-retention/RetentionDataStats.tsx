/**
 * 📈 Retention Data Statistics Component
 * Estatísticas detalhadas dos dados retidos por tabela e tipo
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Zap, 
  Eye, 
  HardDrive,
  BarChart3,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface TableStats {
  table_name: string;
  total_records: number;
  total_size_mb: number;
  avg_quality_score: number;
  active_records: number;
  archived_records: number;
  expired_records: number;
  avg_access_count: number;
  oldest_record: string;
  newest_record: string;
}

interface DataTypeStats {
  data_type: string;
  count: number;
  size_mb: number;
  avg_quality: number;
}

const RetentionDataStats: React.FC = () => {
  // Mock data - em produção viria da API
  const tableStats: TableStats[] = [
    {
      table_name: 'ml_feature_store',
      total_records: 1250,
      total_size_mb: 156.8,
      avg_quality_score: 0.82,
      active_records: 1100,
      archived_records: 120,
      expired_records: 30,
      avg_access_count: 15.3,
      oldest_record: '2024-01-15T10:30:00Z',
      newest_record: '2024-09-04T14:25:00Z'
    },
    {
      table_name: 'ml_training_cache',
      total_records: 45,
      total_size_mb: 320.5,
      avg_quality_score: 0.91,
      active_records: 38,
      archived_records: 5,
      expired_records: 2,
      avg_access_count: 28.7,
      oldest_record: '2024-02-10T08:15:00Z',
      newest_record: '2024-09-04T12:10:00Z'
    },
    {
      table_name: 'ml_inference_cache',
      total_records: 2840,
      total_size_mb: 45.2,
      avg_quality_score: 0.76,
      active_records: 2650,
      archived_records: 150,
      expired_records: 40,
      avg_access_count: 8.9,
      oldest_record: '2024-08-28T16:45:00Z',
      newest_record: '2024-09-04T14:50:00Z'
    },
    {
      table_name: 'aggregated_time_series',
      total_records: 380,
      total_size_mb: 89.3,
      avg_quality_score: 0.88,
      active_records: 350,
      archived_records: 25,
      expired_records: 5,
      avg_access_count: 22.1,
      oldest_record: '2024-01-01T00:00:00Z',
      newest_record: '2024-09-04T13:30:00Z'
    }
  ];

  const dataTypeStats: DataTypeStats[] = [
    { data_type: 'temporal', count: 420, size_mb: 85.6, avg_quality: 0.84 },
    { data_type: 'spatial', count: 380, size_mb: 92.1, avg_quality: 0.79 },
    { data_type: 'environmental', count: 520, size_mb: 156.3, avg_quality: 0.87 },
    { data_type: 'species', count: 290, size_mb: 67.8, avg_quality: 0.81 },
    { data_type: 'training_set', count: 45, size_mb: 320.5, avg_quality: 0.91 },
    { data_type: 'prediction', count: 2840, size_mb: 45.2, avg_quality: 0.76 },
    { data_type: 'aggregation', count: 380, size_mb: 89.3, avg_quality: 0.88 }
  ];

  const getTableIcon = (tableName: string) => {
    const icons = {
      ml_feature_store: <Database className="h-5 w-5 text-blue-600" />,
      ml_training_cache: <Zap className="h-5 w-5 text-green-600" />,
      ml_inference_cache: <Eye className="h-5 w-5 text-purple-600" />,
      aggregated_time_series: <HardDrive className="h-5 w-5 text-orange-600" />
    };
    return icons[tableName as keyof typeof icons] || <Database className="h-5 w-5" />;
  };

  const getTableDisplayName = (tableName: string) => {
    const names = {
      ml_feature_store: 'Feature Store',
      ml_training_cache: 'Training Cache',
      ml_inference_cache: 'Inference Cache',
      aggregated_time_series: 'Time Series'
    };
    return names[tableName as keyof typeof names] || tableName;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatSize = (sizeMb: number) => {
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(1)} KB`;
    if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
    return `${(sizeMb / 1024).toFixed(1)} GB`;
  };

  // Cores para gráficos
  const COLORS = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

  // Dados para gráfico de pizza (distribuição por tabela)
  const pieData = tableStats.map((table, index) => ({
    name: getTableDisplayName(table.table_name),
    value: table.total_records,
    color: COLORS[index % COLORS.length]
  }));

  // Dados para gráfico de barras (tamanho por tipo)
  const barData = dataTypeStats.map(stat => ({
    name: stat.data_type,
    size: stat.size_mb,
    quality: stat.avg_quality * 100
  }));

  const totalRecords = tableStats.reduce((sum, table) => sum + table.total_records, 0);
  const totalSize = tableStats.reduce((sum, table) => sum + table.total_size_mb, 0);
  const avgQuality = tableStats.reduce((sum, table) => sum + table.avg_quality_score, 0) / tableStats.length;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Distribuídos por {tableStats.length} tabelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Total</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Dados retidos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgQuality * 100).toFixed(1)}%</div>
            <Progress value={avgQuality * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tableStats.reduce((sum, table) => sum + table.active_records, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((tableStats.reduce((sum, table) => sum + table.active_records, 0) / totalRecords) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tabela</CardTitle>
            <CardDescription>Número de registos por tabela</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tamanho por Tipo de Dados</CardTitle>
            <CardDescription>Espaço utilizado por tipo de dados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'size' ? `${value} MB` : `${value}%`,
                  name === 'size' ? 'Tamanho' : 'Qualidade'
                ]} />
                <Bar dataKey="size" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por Tabela */}
      <div className="grid gap-4 md:grid-cols-2">
        {tableStats.map((table) => (
          <Card key={table.table_name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTableIcon(table.table_name)}
                  <CardTitle className="text-lg">
                    {getTableDisplayName(table.table_name)}
                  </CardTitle>
                </div>
                <Badge variant="outline">
                  {table.total_records.toLocaleString()} registos
                </Badge>
              </div>
              <CardDescription>
                {formatSize(table.total_size_mb)} • Qualidade média: {(table.avg_quality_score * 100).toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status dos Registos */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Distribuição de Status</span>
                  <span>{table.total_records} total</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Ativos</span>
                    </span>
                    <span>{table.active_records}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Arquivados</span>
                    </span>
                    <span>{table.archived_records}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Expirados</span>
                    </span>
                    <span>{table.expired_records}</span>
                  </div>
                </div>
              </div>

              {/* Métricas de Uso */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Acessos Médios</span>
                  <div className="font-medium">{table.avg_access_count.toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Qualidade</span>
                  <div className="font-medium">{(table.avg_quality_score * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mais Antigo</span>
                  <div className="font-medium text-xs">{formatDate(table.oldest_record)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mais Recente</span>
                  <div className="font-medium text-xs">{formatDate(table.newest_record)}</div>
                </div>
              </div>

              {/* Barra de Qualidade */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Score de Qualidade</span>
                  <span>{(table.avg_quality_score * 100).toFixed(1)}%</span>
                </div>
                <Progress value={table.avg_quality_score * 100} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights e Recomendações</CardTitle>
          <CardDescription>Análise automática dos dados retidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">📊 Insights</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Training cache tem a melhor qualidade média (91%)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>Feature store é a tabela com mais dados (1,250 registos)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <span>Inference cache tem rotatividade alta (TTL curto)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span>Time series mantém histórico desde Janeiro</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">🎯 Recomendações</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="text-green-600">✓</span>
                  <span>Sistema funcionando de forma otimizada</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>Considerar aumentar TTL do inference cache</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠</span>
                  <span>Monitorizar crescimento do feature store</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-purple-600">•</span>
                  <span>Executar limpeza de dados expirados semanalmente</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RetentionDataStats;
