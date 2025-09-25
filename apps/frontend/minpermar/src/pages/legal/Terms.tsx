import React from 'react'
import PagePlaceholder from '../../components/PagePlaceholder'

const Terms: React.FC = () => {
  return (
    <PagePlaceholder
      title="Termos de Uso"
      subtitle="Condições de utilização do site"
      description="Termos e condições para utilização dos serviços digitais do MINPERMAR."
      features={['Condições de Uso', 'Responsabilidades', 'Limitações']}
      bgColor="from-slate-700 via-slate-600 to-gray-600"
    />
  )
}

export default Terms
