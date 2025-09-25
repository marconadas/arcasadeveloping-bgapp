import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../components/PagePlaceholder'

const BlueEconomy: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('nav.blueEconomy')}
      subtitle="Desenvolvimento da economia azul em Angola"
      description="Esta página conterá informações completas sobre a estratégia nacional para a economia azul, projetos em curso e oportunidades de investimento."
      features={['Projetos Estratégicos', 'Investimento Privado', 'Parcerias Internacionais']}
      bgColor="from-blue-700 via-cyan-600 to-teal-600"
    />
  )
}

export default BlueEconomy
