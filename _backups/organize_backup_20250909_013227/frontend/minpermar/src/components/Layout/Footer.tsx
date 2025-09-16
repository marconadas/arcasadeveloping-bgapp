import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

const Footer: React.FC = () => {
  const { t } = useTranslation()

  const quickLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/sobre', label: t('nav.about') },
    { href: '/servicos', label: t('nav.services') },
    { href: '/noticias', label: t('nav.news') },
    { href: '/transparencia', label: t('nav.transparency') },
    { href: '/contacto', label: t('nav.contact') }
  ]

  const services = [
    { href: '/servicos/licenciamento', label: t('services.licensing') },
    { href: '/servicos/certificacao', label: t('services.certification') },
    { href: '/servicos/consultoria', label: t('services.consultation') },
    { href: '/servicos/denuncias', label: t('services.reporting') }
  ]

  const externalLinks = [
    { href: 'http://localhost:8001/admin', label: 'BGAPP Admin', external: true },
    { href: 'http://localhost:8082', label: 'STAC Browser', external: true },
    { href: 'http://localhost:5555', label: 'Flower Monitor', external: true }
  ]

  return (
    <footer className="bg-ocean-blue-900 text-white">
      <div className="container">
        {/* Main Footer */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-ocean-blue-700 font-bold text-lg">🐟</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">MINPERMAR</h3>
                  <p className="text-ocean-blue-200 text-sm">República de Angola</p>
                </div>
              </div>
              <p className="text-ocean-blue-100 text-sm leading-relaxed mb-6">
                {t('footer.description')}
              </p>
              
              {/* Social Media */}
              <div>
                <h4 className="font-semibold mb-3">{t('footer.followUs')}</h4>
                <div className="flex space-x-4">
                  <a href="#" className="w-8 h-8 bg-ocean-blue-800 rounded-lg flex items-center justify-center hover:bg-ocean-blue-700 transition-colors">
                    <span className="text-sm">📘</span>
                  </a>
                  <a href="#" className="w-8 h-8 bg-ocean-blue-800 rounded-lg flex items-center justify-center hover:bg-ocean-blue-700 transition-colors">
                    <span className="text-sm">📷</span>
                  </a>
                  <a href="#" className="w-8 h-8 bg-ocean-blue-800 rounded-lg flex items-center justify-center hover:bg-ocean-blue-700 transition-colors">
                    <span className="text-sm">🐦</span>
                  </a>
                  <a href="#" className="w-8 h-8 bg-ocean-blue-800 rounded-lg flex items-center justify-center hover:bg-ocean-blue-700 transition-colors">
                    <span className="text-sm">📺</span>
                  </a>
                  <a href="#" className="w-8 h-8 bg-ocean-blue-800 rounded-lg flex items-center justify-center hover:bg-ocean-blue-700 transition-colors">
                    <span className="text-sm">💼</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link 
                      to={link.href}
                      className="text-ocean-blue-100 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-4">{t('services.title')}</h4>
              <ul className="space-y-2">
                {services.map((service) => (
                  <li key={service.href}>
                    <Link 
                      to={service.href}
                      className="text-ocean-blue-100 hover:text-white transition-colors text-sm"
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* External Systems */}
              <div className="mt-6">
                <h5 className="font-medium mb-3 text-ocean-blue-200">Sistemas Integrados</h5>
                <ul className="space-y-2">
                  {externalLinks.map((link) => (
                    <li key={link.href}>
                      <a 
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ocean-blue-100 hover:text-white transition-colors text-sm flex items-center"
                      >
                        {link.label}
                        <ExternalLink size={12} className="ml-1" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin size={16} className="text-ocean-blue-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-ocean-blue-100 text-sm">
                      Ministério das Pescas e Recursos Marinhos<br />
                      {t('footer.address')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone size={16} className="text-ocean-blue-300 flex-shrink-0" />
                  <a href="tel:+244222000000" className="text-ocean-blue-100 hover:text-white transition-colors text-sm">
                    {t('footer.phone')}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-ocean-blue-300 flex-shrink-0" />
                  <a href="mailto:info@minpermar.gov.ao" className="text-ocean-blue-100 hover:text-white transition-colors text-sm">
                    {t('footer.email')}
                  </a>
                </div>
              </div>

              {/* Newsletter */}
              <div className="mt-6">
                <h5 className="font-medium mb-3">Newsletter</h5>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Seu email..."
                    className="flex-1 px-3 py-2 bg-ocean-blue-800 border border-ocean-blue-700 rounded-l-lg text-white placeholder-ocean-blue-300 text-sm focus:outline-none focus:border-ocean-blue-500"
                  />
                  <button className="px-4 py-2 bg-ocean-green-600 hover:bg-ocean-green-700 rounded-r-lg transition-colors">
                    <Mail size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-ocean-blue-800 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-ocean-blue-200 text-sm">
              © 2025 MINPERMAR - Ministério das Pescas e Recursos Marinhos de Angola. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/privacidade" className="text-ocean-blue-200 hover:text-white transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-ocean-blue-200 hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link to="/acessibilidade" className="text-ocean-blue-200 hover:text-white transition-colors">
                Acessibilidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
