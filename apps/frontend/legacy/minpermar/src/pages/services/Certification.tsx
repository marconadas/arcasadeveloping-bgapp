import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../../components/PagePlaceholder'

const Certification: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('services.certification')}
      subtitle="Certificação de produtos da pesca"
      description="Certificação de produtos da pesca e aquicultura para mercado nacional e internacional."
      features={['Certificação Sanitária', 'Rastreabilidade', 'Exportação']}
      bgColor="from-green-700 via-green-600 to-emerald-600"
    />
  )
}

export default Certification
