import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import LanguageSelector from './LanguageSelector'

const Header: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

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

  return (
    <>
      {/* Top Bar */}
      <div className="bg-ocean-blue-900 text-white py-2 text-sm">
        <div className="container">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span>📧 info@minpermar.gov.ao</span>
              <span>📞 +244 222 000 000</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <div className="flex space-x-2">
                <a href="#" className="hover:text-ocean-blue-200 transition-colors">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="hover:text-ocean-blue-200 transition-colors">
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
                <a href="#" className="hover:text-ocean-blue-200 transition-colors">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur shadow-lg' 
            : 'bg-white'
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="MINPERMAR Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-ocean-blue-900">
                  MINPERMAR
                </h1>
                <p className="text-sm text-gray-600">
                  República de Angola
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.slice(0, 6).map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'bg-ocean-blue-700 text-white'
                      : 'text-gray-700 hover:bg-ocean-blue-50 hover:text-ocean-blue-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* More Menu */}
              <div className="relative group">
                <button className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-ocean-blue-50 hover:text-ocean-blue-700 transition-colors">
                  Mais
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {navigationItems.slice(6).map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`block px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        isActiveLink(item.href)
                          ? 'bg-ocean-blue-50 text-ocean-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white border-t border-gray-200"
            >
              <div className="container py-4">
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={closeMenu}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActiveLink(item.href)
                          ? 'bg-ocean-blue-700 text-white'
                          : 'text-gray-700 hover:bg-ocean-blue-50 hover:text-ocean-blue-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  )
}

export default Header
