import React from 'react'
import { useTranslation } from 'react-i18next'
import PagePlaceholder from '../components/PagePlaceholder'

const Contact: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PagePlaceholder
      title={t('nav.contact')}
      subtitle="Entre em contacto connosco"
      description="Formulários de contacto, informações de localização, horários de atendimento e canais de comunicação com o MINPERMAR."
      features={['Formulário de Contacto', 'Localização e Horários', 'Suporte Online']}
      bgColor="from-teal-700 via-cyan-600 to-blue-600"
    />
  )
}

export default Contact
