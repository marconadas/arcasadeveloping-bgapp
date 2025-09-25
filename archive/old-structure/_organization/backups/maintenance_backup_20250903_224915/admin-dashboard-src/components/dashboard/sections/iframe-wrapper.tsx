'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  LinkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface IframeWrapperProps {
  title: string
  description: string
  src: string
  icon?: React.ComponentType<any>
  height?: string
  allowFullscreen?: boolean
  showControls?: boolean
}

export function IframeWrapper({ 
  title, 
  description, 
  src, 
  icon: Icon,
  height = '800px',
  allowFullscreen = true,
  showControls = true 
}: IframeWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setHasError(false)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const openInNewTab = () => {
    window.open(src, '_blank')
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  if (isFullscreen) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
            title="Atualizar"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={openInNewTab}
            className="p-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
            title="Abrir em nova aba"
          >
            <LinkIcon className="h-5 w-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
            title="Sair do ecrã completo"
          >
            <ArrowsPointingInIcon className="h-5 w-5" />
          </button>
        </div>
        
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          title={title}
          allow="geolocation; camera; microphone; fullscreen"
        />
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 mb-3">
          {Icon && <Icon className="h-8 w-8" />}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-blue-100">{description}</p>
          </div>
        </div>
        
        {showControls && (
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Atualizar
            </button>
            
            <button
              onClick={openInNewTab}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              Nova Aba
            </button>
            
            {allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
                Ecrã Completo
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Iframe Container */}
      <motion.div 
        className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isLoading && (
          <div className="flex items-center justify-center p-8" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Carregando interface...</p>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="flex items-center justify-center p-8" style={{ height }}>
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Erro ao carregar interface
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Não foi possível carregar a interface. Verifique a conectividade.
              </p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={src}
          className={`w-full border-0 ${isLoading || hasError ? 'hidden' : ''}`}
          style={{ height }}
          onLoad={handleLoad}
          onError={handleError}
          title={title}
          allow="geolocation; camera; microphone; fullscreen"
          loading="lazy"
        />
      </motion.div>

      {/* Additional Info */}
      <motion.div 
        className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Interface Integrada BGAPP
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Esta interface está integrada diretamente do sistema BGAPP principal. 
              Todas as funcionalidades e dados são atualizados em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Ativo
          </div>
        </div>
      </motion.div>
    </div>
  )
}
