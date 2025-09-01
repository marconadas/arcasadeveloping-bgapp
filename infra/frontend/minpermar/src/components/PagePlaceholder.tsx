import React from 'react'
import { motion } from 'framer-motion'

interface PagePlaceholderProps {
  title: string
  subtitle: string
  description: string
  features?: string[]
  bgColor?: string
}

const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  title,
  subtitle,
  description,
  features = [],
  bgColor = 'from-ocean-blue-700 via-ocean-blue-600 to-ocean-green-600'
}) => {
  return (
    <div className="overflow-hidden">
      <section className={`relative py-20 bg-gradient-to-br ${bgColor} text-white`}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-display font-bold mb-6">
              {title}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto">
              {subtitle}
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
            <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
              {description}
            </p>
            
            {features.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <h3 className="text-xl font-semibold mb-4">{feature}</h3>
                    <p className="text-gray-600">Em breve disponível</p>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-12 p-6 bg-ocean-blue-50 rounded-lg max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-ocean-blue-900 mb-2">
                🚧 Site em Construção
              </h3>
              <p className="text-ocean-blue-700 text-sm">
                Estamos a trabalhar para disponibilizar todos os conteúdos e funcionalidades. 
                Enquanto isso, pode aceder aos sistemas integrados através do menu principal.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PagePlaceholder
