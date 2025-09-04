import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../components/PagePlaceholder'

const Studies: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('nav.studies')}
      subtitle="Estudos e relatórios científicos"
      description="Acesso a estudos, relatórios anuais, investigação científica e análises sobre o estado dos recursos marinhos de Angola."
      features={['Relatórios Anuais', 'Estudos Científicos', 'Estatísticas do Setor']}
      bgColor="from-purple-700 via-indigo-600 to-blue-600"
    />
  )
}

export default Studies
