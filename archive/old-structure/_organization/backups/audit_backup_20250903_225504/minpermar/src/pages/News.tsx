import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../components/PagePlaceholder'

const News: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('nav.news')}
      subtitle="Últimas notícias e eventos"
      description="Acompanhe as últimas notícias, eventos, comunicados de imprensa e atividades do MINPERMAR."
      features={['Notícias Recentes', 'Eventos e Conferências', 'Comunicados Oficiais']}
      bgColor="from-red-700 via-pink-600 to-rose-600"
    />
  )
}

export default News
