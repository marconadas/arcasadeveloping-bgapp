import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../components/PagePlaceholder'

const Transparency: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('nav.transparency')}
      subtitle="Transparência e governança"
      description="Informações sobre orçamentos, relatórios de atividades, licitações, contratos públicos e outras informações de transparência governamental."
      features={['Orçamentos Públicos', 'Licitações e Contratos', 'Relatórios de Gestão']}
      bgColor="from-gray-700 via-slate-600 to-zinc-600"
    />
  )
}

export default Transparency
