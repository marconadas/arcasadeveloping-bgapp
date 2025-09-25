import React from 'react'
import PagePlaceholder from '../../components/PagePlaceholder'

const Privacy: React.FC = () => {
  return (
    <PagePlaceholder
      title="Política de Privacidade"
      subtitle="Proteção dos seus dados pessoais"
      description="Informações sobre como coletamos, usamos e protegemos os seus dados pessoais."
      features={['Coleta de Dados', 'Uso da Informação', 'Direitos do Utilizador']}
      bgColor="from-gray-700 via-gray-600 to-slate-600"
    />
  )
}

export default Privacy
