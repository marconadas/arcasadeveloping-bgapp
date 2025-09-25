import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../../components/PagePlaceholder'

const Consultation: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('services.consultation')}
      subtitle="Consultoria técnica especializada"
      description="Serviços de consultoria técnica para pescadores, empresas e investidores do setor."
      features={['Consultoria Gratuita', 'Apoio Técnico', 'Orientação Empresarial']}
      bgColor="from-purple-700 via-purple-600 to-indigo-600"
    />
  )
}

export default Consultation
