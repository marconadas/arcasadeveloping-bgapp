import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../../components/PagePlaceholder'

const Licensing: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('services.licensing')}
      subtitle="Licenciamento online de pesca"
      description="Sistema integrado para licenciamento de atividades de pesca artesanal, semi-industrial e industrial."
      features={['Pesca Artesanal', 'Pesca Industrial', 'Renovação de Licenças']}
      bgColor="from-blue-700 via-blue-600 to-indigo-600"
    />
  )
}

export default Licensing
