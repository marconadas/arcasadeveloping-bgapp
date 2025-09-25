import React from 'react'
import PagePlaceholder from '../../components/PagePlaceholder'

const Accessibility: React.FC = () => {
  return (
    <PagePlaceholder
      title="Acessibilidade"
      subtitle="Compromisso com a inclusão digital"
      description="Informações sobre as medidas de acessibilidade implementadas no site do MINPERMAR."
      features={['Padrões WCAG', 'Navegação Assistida', 'Suporte Técnico']}
      bgColor="from-indigo-700 via-indigo-600 to-purple-600"
    />
  )
}

export default Accessibility
