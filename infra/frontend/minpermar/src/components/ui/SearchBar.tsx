import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'
import { cn } from '../../utils/cn'

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  url: string
  relevance: number
}

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  results?: SearchResult[]
  recentSearches?: string[]
  popularSearches?: string[]
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Pesquisar serviços, informações...",
  className,
  onSearch,
  results = [],
  recentSearches = [],
  popularSearches = ['Licenciamento de Pesca', 'Aquicultura', 'Áreas Protegidas', 'Estatísticas']
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length > 0 || value === '')
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const selectedResult = results[selectedIndex]
      if (selectedResult) {
        window.location.href = selectedResult.url
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleClearSearch = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    if (onSearch) {
      onSearch(searchTerm)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Serviços': 'blue',
      'Informação': 'green',
      'Documentos': 'yellow',
      'Contato': 'red'
    } as const
    return colors[category as keyof typeof colors] || 'blue'
  }

  return (
    <div ref={resultsRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-12 py-4 text-lg rounded-2xl border border-gray-200",
            "focus:outline-none focus:ring-2 focus:ring-ocean-blue-500 focus:border-transparent",
            "bg-white shadow-lg transition-all duration-200",
            "placeholder-gray-500"
          )}
        />
        
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-hidden"
          >
            {query && results.length > 0 ? (
              // Search Results
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Resultados da Pesquisa
                </div>
                {results.map((result, index) => (
                  <motion.a
                    key={result.id}
                    href={result.url}
                    className={cn(
                      "block px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 border-transparent",
                      selectedIndex === index && "bg-ocean-blue-50 border-ocean-blue-500"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{result.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{result.description}</div>
                      </div>
                      <Badge
                        variant="outline"
                        size="sm"
                        className="ml-3"
                      >
                        {result.category}
                      </Badge>
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : (
              // Popular and Recent Searches
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Pesquisas Recentes
                    </div>
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handlePopularSearch(search)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                )}
                
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Pesquisas Populares
                  </div>
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handlePopularSearch(search)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
