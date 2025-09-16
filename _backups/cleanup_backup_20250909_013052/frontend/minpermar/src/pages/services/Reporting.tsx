import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../../components/PagePlaceholder'

const Reporting: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('services.reporting')}
      subtitle="Denúncias de atividades ilegais"
      description="Sistema seguro para denúncia de pesca ilegal e proteção dos recursos marinhos."
      features={['Denúncia Anônima', 'Proteção de Testemunhas', 'Resposta Rápida']}
      bgColor="from-red-700 via-red-600 to-pink-600"
    />
  )
}

export default Reporting
