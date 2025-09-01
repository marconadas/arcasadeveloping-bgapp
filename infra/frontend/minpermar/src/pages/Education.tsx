import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../components/PagePlaceholder'

const Education: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('nav.education')}
      subtitle="Formação e capacitação no setor das pescas"
      description="Esta página incluirá todos os programas de formação, cursos online, materiais educativos e oportunidades de capacitação para pescadores e técnicos."
      features={['Cursos Online', 'Formação Técnica', 'Materiais Educativos']}
      bgColor="from-green-700 via-emerald-600 to-teal-600"
    />
  )
}

export default Education
