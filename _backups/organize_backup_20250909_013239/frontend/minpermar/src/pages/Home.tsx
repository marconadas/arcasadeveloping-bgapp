import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Fish, 
  Waves, 
  Anchor, 
  Users, 
  TrendingUp, 
  Shield, 
  Award,
  ArrowRight,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  BarChart3,
  Globe,
  Zap
} from 'lucide-react'

import { HeroSection } from '../components/ui/HeroSection'
import { MetricCard } from '../components/ui/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { InteractiveDashboard } from '../components/ui/InteractiveDashboard'
import type { Stats, NewsItem } from '../types'

const Home: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>({
    fishermenRegistered: 45678,
    aquacultureFarms: 1234,
    protectedAreas: 89,
    annualProduction: 567890
  })
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])

  // Mock news data - will be replaced with API call
  useEffect(() => {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Nova Política Nacional de Aquicultura Aprovada',
        excerpt: 'O MINPERMAR aprovou nova política para impulsionar o setor da aquicultura em Angola.',
        content: '',
        image: '/images/news/aquaculture-policy.jpg',
        date: '2025-01-15',
        category: 'Política',
        author: 'MINPERMAR',
        slug: 'nova-politica-aquicultura'
      },
      {
        id: '2',
        title: 'Programa de Capacitação para Pescadores Artesanais',
        excerpt: 'Lançado programa de formação técnica para pescadores das comunidades costeiras.',
        content: '',
        image: '/images/news/fishermen-training.jpg',
        date: '2025-01-12',
        category: 'Capacitação',
        author: 'MINPERMAR',
        slug: 'capacitacao-pescadores'
      },
      {
        id: '3',
        title: 'Angola Participa na Conferência Internacional dos Oceanos',
        excerpt: 'Delegação angolana apresenta iniciativas de economia azul na conferência em Lisboa.',
        content: '',
        image: '/images/news/ocean-conference.jpg',
        date: '2025-01-10',
        category: 'Internacional',
        author: 'MINPERMAR',
        slug: 'conferencia-oceanos'
      }
    ]
    setLatestNews(mockNews)
  }, [])

  const services = [
    {
      icon: <Fish className="w-8 h-8" />,
      title: t('services.licensing'),
      description: 'Licenciamento online para atividades de pesca',
      href: '/servicos/licenciamento',
      color: 'bg-blue-500'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t('services.certification'),
      description: 'Certificação de produtos da pesca e aquicultura',
      href: '/servicos/certificacao',
      color: 'bg-green-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('services.consultation'),
      description: 'Consultoria técnica especializada',
      href: '/servicos/consultoria',
      color: 'bg-purple-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('services.reporting'),
      description: 'Denúncia de atividades ilegais',
      href: '/servicos/denuncias',
      color: 'bg-red-500'
    }
  ]

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-AO').format(num)
  }

  return (
    <div className="overflow-hidden">
      {/* Modern Hero Section */}
      <HeroSection
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        description="Promovendo o desenvolvimento sustentável dos recursos marinhos de Angola através de políticas inovadoras, tecnologia avançada e parcerias estratégicas."
        badge="🇦🇴 República de Angola"
        primaryCTA={{
          text: t('hero.cta'),
          href: '/servicos',
          onClick: () => window.location.href = '/minpermar-site/servicos'
        }}
        secondaryCTA={{
          text: t('hero.learnMore'),
          href: '/sobre',
          onClick: () => window.location.href = '/minpermar-site/sobre'
        }}
        stats={[
          { label: 'Pescadores Registados', value: formatNumber(stats.fishermenRegistered) },
          { label: 'Fazendas de Aquicultura', value: formatNumber(stats.aquacultureFarms) },
          { label: 'Áreas Protegidas', value: stats.protectedAreas.toString() },
          { label: 'Produção Anual (t)', value: (stats.annualProduction / 1000).toFixed(0) + 'K' }
        ]}
      />

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Impacto em Números
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dados em tempo real que demonstram o crescimento e desenvolvimento do setor marítimo angolano
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title={t('stats.fishermenRegistered')}
              value={stats.fishermenRegistered}
              change={12.5}
              changeLabel="vs. ano anterior"
              icon={<Users className="h-6 w-6" />}
              trend="up"
              color="blue"
              description="Pescadores licenciados"
            />
            <MetricCard
              title={t('stats.aquacultureFarms')}
              value={stats.aquacultureFarms}
              change={8.3}
              changeLabel="crescimento mensal"
              icon={<Fish className="h-6 w-6" />}
              trend="up"
              color="green"
              description="Fazendas ativas"
            />
            <MetricCard
              title={t('stats.protectedAreas')}
              value={stats.protectedAreas}
              change={2.1}
              changeLabel="novas áreas"
              icon={<Shield className="h-6 w-6" />}
              trend="up"
              color="blue"
              description="Zonas protegidas"
            />
            <MetricCard
              title={t('stats.annualProduction')}
              value={`${(stats.annualProduction / 1000).toFixed(0)}K t`}
              change={15.7}
              changeLabel="aumento anual"
              icon={<BarChart3 className="h-6 w-6" />}
              trend="up"
              color="green"
              description="Produção total"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              {t('services.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Acesso rápido e fácil aos serviços digitais do MINPERMAR
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={service.href}
                  className="card p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className={`${service.color} w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-center text-ocean-blue-700 font-medium">
                    Aceder
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-6">
                {t('about.mission')}
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('about.missionText')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-ocean-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Waves className="w-6 h-6 text-ocean-blue-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Sustentabilidade</h4>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-ocean-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-ocean-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Crescimento</h4>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Proteção</h4>
                </div>
              </div>

              <Link
                to="/sobre"
                className="btn btn-primary"
              >
                {t('common.readMore')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden">
                <img
                  src="/images/hero/fishing-boats.jpg"
                  alt="Pescadores angolanos"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-ocean-blue-700 rounded-full flex items-center justify-center">
                <Anchor className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Últimas Notícias
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Acompanhe as últimas novidades do setor das pescas e recursos marinhos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestNews.map((news, index) => (
              <motion.article
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(news.date).toLocaleDateString('pt-AO')}
                    <span className="mx-2">•</span>
                    <span className="bg-ocean-blue-100 text-ocean-blue-700 px-2 py-1 rounded-full text-xs">
                      {news.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {news.excerpt}
                  </p>
                  <Link
                    to={`/noticias/${news.slug}`}
                    className="inline-flex items-center text-ocean-blue-700 font-medium hover:text-ocean-blue-800 transition-colors"
                  >
                    {t('common.readMore')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/noticias"
              className="btn btn-outline"
            >
              {t('common.viewAll')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding ocean-gradient text-white">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-6">
              Precisa de Ajuda ou Informações?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Nossa equipe está pronta para ajudar com suas necessidades relacionadas às pescas e recursos marinhos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contacto"
                className="btn bg-white text-ocean-blue-700 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
              >
                Entrar em Contacto
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="http://localhost:8001/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline border-white text-white hover:bg-white hover:text-ocean-blue-700 px-8 py-4 text-lg font-semibold"
              >
                BGAPP Admin
                <ExternalLink className="ml-2 w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Dashboard Section */}
      <section className="section-padding bg-gradient-to-b from-gray-50 to-white">
        <div className="container">
          <InteractiveDashboard />
        </div>
      </section>
    </div>
  )
}

export default Home
