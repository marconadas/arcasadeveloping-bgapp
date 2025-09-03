'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Report {
  id: string
  name: string
  filename: string
  description: string
  type: string
  icon: string
  generated_at: string
  size: string
  format: string
  status: string
  path: string
}

interface ReportContent {
  id: string
  filename: string
  content: string
  format: string
  size: string
  last_modified: string
  path: string
}

interface ReportsResponse {
  reports: Report[]
  total: number
  by_type: Record<string, number>
  timestamp: string
}

export function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [selectedReport, setSelectedReport] = useState<ReportContent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Carregar relatórios
  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Tentar conectar ao nosso servidor de relatórios
      const response = await fetch('http://localhost:8001/api/reports')
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      const data: ReportsResponse = await response.json()
      
      setReports(data.reports || [])
      setStats(data.by_type || {})
      
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err)
      setError('Erro ao carregar relatórios. Verifique se o servidor está ativo em localhost:8001')
    } finally {
      setLoading(false)
    }
  }

  const openReport = async (reportId: string) => {
    try {
      const response = await fetch(`http://localhost:8001/api/reports/${reportId}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar relatório: ${response.status}`)
      }
      
      const reportContent: ReportContent = await response.json()
      setSelectedReport(reportContent)
      setShowModal(true)
      
    } catch (err) {
      console.error('Erro ao abrir relatório:', err)
      alert('Erro ao carregar o conteúdo do relatório')
    }
  }

  const downloadReport = (reportId: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `http://localhost:8001/api/reports/${reportId}`
    link.download = filename
    link.click()
  }

  // Filtrar relatórios
  const filteredReports = reports.filter(report => {
    const matchesType = !typeFilter || report.type === typeFilter
    const matchesSearch = !searchTerm || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesSearch
  })

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'auditoria': 'bg-green-100 text-green-800',
      'relatorio': 'bg-blue-100 text-blue-800',
      'implementacao': 'bg-purple-100 text-purple-800',
      'solucao': 'bg-orange-100 text-orange-800',
      'correcoes': 'bg-red-100 text-red-800',
      'melhorias': 'bg-pink-100 text-pink-800',
      'automatico': 'bg-gray-100 text-gray-800',
      'system': 'bg-indigo-100 text-indigo-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
        <div className="flex items-center gap-4 mb-6">
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold">Relatórios BGAPP</h2>
            <p className="text-slate-600 dark:text-slate-400">Sistema de gestão de relatórios técnicos</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-600">Carregando relatórios...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
        <div className="flex items-center gap-4 mb-6">
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold">Relatórios BGAPP</h2>
            <p className="text-slate-600 dark:text-slate-400">Sistema de gestão de relatórios técnicos</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-red-600">
          <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
          <div className="text-center">
            <p className="font-medium">Erro ao carregar relatórios</p>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <button 
              onClick={loadReports}
              className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChartBarIcon className="h-8 w-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold">Relatórios BGAPP</h2>
            <p className="text-slate-600 dark:text-slate-400">Sistema de gestão de relatórios técnicos</p>
          </div>
        </div>
        <button 
          onClick={loadReports}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 border rounded-lg dark:border-slate-700">
          <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total</div>
        </div>
        <div className="text-center p-4 border rounded-lg dark:border-slate-700">
          <div className="text-2xl font-bold text-green-600">{stats.auditoria || 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Auditorias</div>
        </div>
        <div className="text-center p-4 border rounded-lg dark:border-slate-700">
          <div className="text-2xl font-bold text-purple-600">{stats.implementacao || 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Implementações</div>
        </div>
        <div className="text-center p-4 border rounded-lg dark:border-slate-700">
          <div className="text-2xl font-bold text-orange-600">{stats.solucao || 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Soluções</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-slate-500" />
          <span className="font-medium text-sm">Filtros:</span>
        </div>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
        >
          <option value="">Todos os tipos</option>
          <option value="auditoria">🔍 Auditorias</option>
          <option value="relatorio">📊 Relatórios</option>
          <option value="implementacao">⚙️ Implementações</option>
          <option value="solucao">🔧 Soluções</option>
          <option value="correcoes">🐛 Correções</option>
          <option value="melhorias">✨ Melhorias</option>
        </select>
        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar relatórios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum relatório encontrado</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-grow">
                  <div className="text-2xl">{report.icon}</div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-lg">{report.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{report.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatDate(report.generated_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DocumentTextIcon className="h-3 w-3" />
                        {report.format}
                      </span>
                      <span>{report.size}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openReport(report.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => downloadReport(report.id, report.filename)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Report Content */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
              <div>
                <h3 className="text-xl font-bold">{selectedReport.filename}</h3>
                <p className="text-sm text-slate-500">
                  {selectedReport.format} • {selectedReport.size} • 
                  Modificado: {formatDate(selectedReport.last_modified)}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              <pre className="whitespace-pre-wrap text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto">
                {selectedReport.content}
              </pre>
            </div>
            <div className="flex justify-between items-center p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
              <span className="text-sm text-slate-600">{selectedReport.path}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReport(selectedReport.id, selectedReport.filename)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
