import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe, ChevronDown, Bell, User, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchBar } from '../ui/SearchBar'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import LanguageSelector from './LanguageSelector'

const EnhancedHeader: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)

  const navigationItems = [
    { href: '/', label: t('nav.home') },
    { href: '/sobre', label: t('nav.about') },
    { href: '/pescas', label: t('nav.fisheries') },
    { href: '/aquicultura', label: t('nav.aquaculture') },
    { href: '/economia-azul', label: t('nav.blueEconomy') },
    { href: '/servicos', label: t('nav.services') },
    { href: '/educacao', label: t('nav.education') },
    { href: '/estudos', label: t('nav.studies') },
    { href: '/noticias', label: t('nav.news') },
    { href: '/transparencia', label: t('nav.transparency') },
    { href: '/contacto', label: t('nav.contact') }
  ]

  // Mock search results
  const searchResults = [
    {
      id: '1',
      title: 'Licenciamento de Pesca',
      description: 'Obtenha sua licença para atividades pesqueiras',
      category: 'Serviços',
      url: '/servicos/licenciamento',
      relevance: 0.9
    },
    {
      id: '2',
      title: 'Certificação de Produtos',
      description: 'Certificação para produtos da pesca e aquicultura',
      category: 'Serviços',
      url: '/servicos/certificacao',
      relevance: 0.8
    }
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const isActiveLink = (href: string) => {
    return location.pathname === href
  }

  const handleSearch = (query: string) => {
    console.log('Searching for:', query)
    // Implementar lógica de pesquisa aqui
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-ocean-blue-600 to-ocean-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="hidden md:block">
                <div className={`font-display font-bold text-lg transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}>
                  MINPERMAR
                </div>
                <div className={`text-sm transition-colors ${
                  isScrolled ? 'text-gray-600' : 'text-gray-200'
                }`}>
                  República de Angola
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navigationItems.slice(0, 6).map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    isActiveLink(item.href)
                      ? isScrolled
                        ? 'bg-ocean-blue-100 text-ocean-blue-700'
                        : 'bg-white/20 text-white backdrop-blur-sm'
                      : isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className={isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                    >
                      {notificationCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Language Selector */}
              <LanguageSelector />

              {/* User Menu */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className={`xl:hidden ${isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pb-6"
              >
                <SearchBar
                  placeholder="Pesquisar serviços, informações, documentos..."
                  onSearch={handleSearch}
                  results={searchResults}
                  className="mx-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 xl:hidden"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="font-display font-bold text-xl text-gray-900">Menu</div>
                  <Button variant="ghost" size="icon" onClick={closeMenu}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={closeMenu}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActiveLink(item.href)
                          ? 'bg-ocean-blue-100 text-ocean-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <User className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Definições
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20" />
    </>
  )
}

export default EnhancedHeader
