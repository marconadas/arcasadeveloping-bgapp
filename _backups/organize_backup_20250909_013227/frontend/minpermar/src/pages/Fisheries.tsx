import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const Fisheries: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden">
      <section className="relative py-20 bg-gradient-to-br from-ocean-blue-700 via-ocean-blue-600 to-ocean-green-600 text-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-display font-bold mb-6">
              {t('nav.fisheries')}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
              Gestão sustentável dos recursos pesqueiros de Angola
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-8">
              Página em Desenvolvimento
            </h2>
            <p className="text-gray-600 mb-8">
              Esta página está a ser desenvolvida. Em breve terá acesso a informações completas sobre pescas e recursos marinhos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4">Pesca Artesanal</h3>
                <p className="text-gray-600">Apoio às comunidades costeiras</p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4">Pesca Industrial</h3>
                <p className="text-gray-600">Regulamentação e licenciamento</p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-4">Sustentabilidade</h3>
                <p className="text-gray-600">Proteção dos recursos marinhos</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Fisheries
