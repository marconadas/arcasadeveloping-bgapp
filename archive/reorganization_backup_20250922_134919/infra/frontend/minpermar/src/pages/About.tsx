import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Target, Eye, Heart, Users, Award, Globe } from 'lucide-react'

const About: React.FC = () => {
  const { t } = useTranslation()

  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Sustentabilidade',
      description: 'Promovemos práticas sustentáveis na exploração dos recursos marinhos para as gerações futuras.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Transparência',
      description: 'Mantemos total transparência em todas as nossas ações e decisões governamentais.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Inovação',
      description: 'Adotamos tecnologias inovadoras para melhorar a gestão dos recursos marinhos.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Inclusão Social',
      description: 'Garantimos que todas as comunidades costeiras beneficiem do desenvolvimento do setor.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Responsabilidade Ambiental',
      description: 'Protegemos o meio ambiente marinho através de políticas e práticas responsáveis.'
    }
  ]

  const leadership = [
    {
      name: 'Dr. Carmen Moreira',
      position: 'Ministra das Pescas e Recursos Marinhos',
      image: '/images/leadership/minister.jpg',
      bio: 'Especialista em recursos marinhos com mais de 20 anos de experiência no setor.'
    },
    {
      name: 'Eng. João Silva',
      position: 'Secretário de Estado da Pesca',
      image: '/images/leadership/secretary.jpg',
      bio: 'Engenheiro naval com vasta experiência em desenvolvimento de políticas pesqueiras.'
    },
    {
      name: 'Dra. Maria Santos',
      position: 'Diretora Nacional de Aquicultura',
      image: '/images/leadership/director.jpg',
      bio: 'Bióloga marinha especializada em aquicultura sustentável e desenvolvimento rural.'
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
              {t('nav.about')}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
              Conheça a nossa missão, visão e valores que orientam o desenvolvimento sustentável 
              dos recursos marinhos de Angola
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-ocean-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-ocean-blue-700" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                {t('about.mission')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('about.missionText')}
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-ocean-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-ocean-green-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                {t('about.vision')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('about.visionText')}
              </p>
            </motion.div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                {t('about.values')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('about.valuesText')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Detail */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Os Nossos Valores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Valores que orientam todas as nossas ações e decisões no desenvolvimento do setor marinho
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-ocean-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-ocean-blue-700">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Liderança
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conheça os líderes que dirigem o Ministério das Pescas e Recursos Marinhos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leadership.map((leader, index) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {leader.name}
                  </h3>
                  <p className="text-ocean-blue-700 font-medium mb-3">
                    {leader.position}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {leader.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              História do MINPERMAR
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Marcos importantes na evolução do ministério e do setor das pescas em Angola
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  year: '1975',
                  title: 'Criação do Ministério',
                  description: 'Estabelecimento do Ministério das Pescas após a independência de Angola.'
                },
                {
                  year: '1990',
                  title: 'Primeira Lei das Pescas',
                  description: 'Aprovação da primeira legislação abrangente sobre pescas e recursos marinhos.'
                },
                {
                  year: '2005',
                  title: 'Programa Nacional de Aquicultura',
                  description: 'Lançamento do programa nacional para desenvolvimento da aquicultura.'
                },
                {
                  year: '2015',
                  title: 'Estratégia da Economia Azul',
                  description: 'Implementação da estratégia nacional para a economia azul.'
                },
                {
                  year: '2020',
                  title: 'Digitalização dos Serviços',
                  description: 'Início da transformação digital com serviços online para o setor.'
                },
                {
                  year: '2025',
                  title: 'MINPERMAR Digital',
                  description: 'Lançamento da plataforma digital integrada com sistemas BGAPP.'
                }
              ].map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className="flex-1">
                    <div className={`card p-6 ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-ocean-blue-700 text-white rounded-full flex items-center justify-center font-bold">
                          {milestone.year.slice(-2)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {milestone.title}
                          </h3>
                          <p className="text-ocean-blue-700 font-medium">
                            {milestone.year}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-ocean-blue-700 rounded-full relative z-10">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Organizational Structure */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Estrutura Organizacional
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Organização interna do ministério e suas principais direções
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block bg-ocean-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                Ministro das Pescas e Recursos Marinhos
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Secretaria de Estado da Pesca',
                'Direção Nacional de Pescas',
                'Direção Nacional de Aquicultura',
                'Direção Nacional de Recursos Marinhos',
                'Direção Nacional de Inspeção',
                'Direção Nacional de Estudos e Planeamento'
              ].map((department, index) => (
                <motion.div
                  key={department}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-4 text-center bg-ocean-blue-50 border border-ocean-blue-200"
                >
                  <p className="text-ocean-blue-700 font-medium">
                    {department}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
