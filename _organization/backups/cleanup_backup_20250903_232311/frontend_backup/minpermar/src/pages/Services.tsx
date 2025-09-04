import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Fish, 
  Award, 
  Users, 
  Shield, 
  FileText, 
  Download,
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react'

const Services: React.FC = () => {
  const { t } = useTranslation()

  const mainServices = [
    {
      id: 'licensing',
      icon: <Fish className="w-8 h-8" />,
      title: t('services.licensing'),
      description: 'Licenciamento online para atividades de pesca artesanal, semi-industrial e industrial.',
      href: '/servicos/licenciamento',
      color: 'bg-blue-500',
      features: ['Processo 100% digital', 'Aprovação em 5-10 dias', 'Acompanhamento em tempo real'],
      systems: ['MRP', 'CMCS']
    },
    {
      id: 'certification',
      icon: <Award className="w-8 h-8" />,
      title: t('services.certification'),
      description: 'Certificação de produtos da pesca e aquicultura para mercado nacional e exportação.',
      href: '/servicos/certificacao',
      color: 'bg-green-500',
      features: ['Certificação internacional', 'Rastreabilidade completa', 'Conformidade sanitária'],
      systems: ['SIMS', 'CRM']
    },
    {
      id: 'consultation',
      icon: <Users className="w-8 h-8" />,
      title: t('services.consultation'),
      description: 'Consultoria técnica especializada para pescadores, empresas e investidores.',
      href: '/servicos/consultoria',
      color: 'bg-purple-500',
      features: ['Especialistas qualificados', 'Consultoria gratuita', 'Apoio técnico contínuo'],
      systems: ['CRM', 'SRM']
    },
    {
      id: 'reporting',
      icon: <Shield className="w-8 h-8" />,
      title: t('services.reporting'),
      description: 'Sistema de denúncia de atividades ilegais de pesca e proteção dos recursos marinhos.',
      href: '/servicos/denuncias',
      color: 'bg-red-500',
      features: ['Denúncia anônima', 'Resposta rápida', 'Proteção de testemunhas'],
      systems: ['CMCS', 'MRP']
    }
  ]

  const digitalServices = [
    {
      title: 'Portal do Pescador',
      description: 'Acesso a todos os serviços para pescadores registados',
      icon: '🎣',
      status: 'Ativo'
    },
    {
      title: 'Sistema de Quotas',
      description: 'Gestão e monitorização de quotas de pesca',
      icon: '📊',
      status: 'Ativo'
    },
    {
      title: 'Mapa Interativo',
      description: 'Zonas de pesca, áreas protegidas e infraestruturas',
      icon: '🗺️',
      status: 'Ativo'
    },
    {
      title: 'Centro de Dados',
      description: 'Acesso a dados científicos e estatísticas do setor',
      icon: '📈',
      status: 'Ativo'
    }
  ]

  const integratedSystems = [
    {
      name: 'MRP',
      fullName: 'Marine Resource Planning',
      description: 'Planeamento e Gestão de Recursos Marinhos',
      url: 'http://localhost:8001/admin',
      icon: '🌊'
    },
    {
      name: 'CRM',
      fullName: 'Customer Relationship Management',
      description: 'Gestão de Relacionamento com Partes Interessadas',
      url: 'http://localhost:8001/admin',
      icon: '👥'
    },
    {
      name: 'SIMS',
      fullName: 'Scientific Information Management System',
      description: 'Sistema de Gestão da Informação Científica',
      url: 'http://localhost:8082',
      icon: '🔬'
    },
    {
      name: 'CMCS',
      fullName: 'Compliance Management and Control System',
      description: 'Sistema de Controlo e Gestão da Conformidade',
      url: 'http://localhost:5555',
      icon: '🛡️'
    },
    {
      name: 'SRM',
      fullName: 'Supplier Relationship Management',
      description: 'Gestão de Relacionamento com Fornecedores',
      url: 'http://localhost:8001/admin',
      icon: '🤝'
    }
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-ocean-blue-700 via-ocean-blue-600 to-ocean-green-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-display font-bold mb-6">
              {t('services.title')}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
              Serviços digitais modernos e eficientes para pescadores, empresas e cidadãos
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Services */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Serviços Principais
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Acesso rápido e seguro aos serviços essenciais do MINPERMAR
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mainServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-start space-x-6">
                  <div className={`${service.color} w-16 h-16 rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Características:</h4>
                      <ul className="space-y-1">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Integrated Systems */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Sistemas Integrados:</h4>
                      <div className="flex space-x-2">
                        {service.systems.map((system, idx) => (
                          <span key={idx} className="bg-ocean-blue-100 text-ocean-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            {system}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={service.href}
                      className="inline-flex items-center text-ocean-blue-700 font-semibold hover:text-ocean-blue-800 transition-colors"
                    >
                      Aceder ao Serviço
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Services */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Serviços Digitais
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataformas digitais integradas para facilitar o acesso à informação e serviços
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {digitalServices.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-600 text-sm font-medium">{service.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrated Systems */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Sistemas Integrados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Acesso direto aos sistemas especializados do MINPERMAR
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integratedSystems.map((system, index) => (
              <motion.div
                key={system.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{system.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {system.name}
                      </h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-ocean-blue-700 font-medium mb-2">
                      {system.fullName}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      {system.description}
                    </p>
                    <a
                      href={system.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-ocean-blue-700 font-medium hover:text-ocean-blue-800 transition-colors group-hover:translate-x-1"
                    >
                      Aceder ao Sistema
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Hours & Contact */}
      <section className="section-padding bg-ocean-blue-50">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Service Hours */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-6">
                Horário de Atendimento
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-ocean-blue-700" />
                  <div>
                    <p className="font-medium text-gray-900">Serviços Online</p>
                    <p className="text-gray-600 text-sm">24 horas por dia, 7 dias por semana</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-ocean-blue-700" />
                  <div>
                    <p className="font-medium text-gray-900">Atendimento Presencial</p>
                    <p className="text-gray-600 text-sm">Segunda a Sexta: 08:00 - 17:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-ocean-blue-700" />
                  <div>
                    <p className="font-medium text-gray-900">Processamento de Licenças</p>
                    <p className="text-gray-600 text-sm">5 a 10 dias úteis</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Downloads */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-6">
                Downloads
              </h3>
              <div className="space-y-3">
                {[
                  'Manual do Utilizador - Licenciamento',
                  'Formulários de Certificação',
                  'Guia de Procedimentos',
                  'Lei das Pescas (Atualizada)',
                  'Regulamentos de Aquicultura'
                ].map((doc, index) => (
                  <div key={doc} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{doc}</span>
                    </div>
                    <button className="text-ocean-blue-700 hover:text-ocean-blue-800 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding ocean-gradient text-white">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-6">
              Precisa de Ajuda?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Nossa equipa de suporte está disponível para ajudar com qualquer questão sobre os nossos serviços.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contacto"
                className="btn bg-white text-ocean-blue-700 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
              >
                Contactar Suporte
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/educacao"
                className="btn btn-outline border-white text-white hover:bg-white hover:text-ocean-blue-700 px-8 py-4 text-lg font-semibold"
              >
                Ver Tutoriais
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
