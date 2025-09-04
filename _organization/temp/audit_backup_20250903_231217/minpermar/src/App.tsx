import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import EnhancedHeader from './components/Layout/EnhancedHeader'
import Footer from './components/Layout/Footer'
import { NotificationSystem, useNotifications } from './components/ui/NotificationSystem'

// Pages
import Home from './pages/Home'
import About from './pages/About'
import Fisheries from './pages/Fisheries'
import Aquaculture from './pages/Aquaculture'
import BlueEconomy from './pages/BlueEconomy'
import Services from './pages/Services'
import Education from './pages/Education'
import Studies from './pages/Studies'
import News from './pages/News'
import Transparency from './pages/Transparency'
import Contact from './pages/Contact'

// Service pages
import Licensing from './pages/services/Licensing'
import Certification from './pages/services/Certification'
import Consultation from './pages/services/Consultation'
import Reporting from './pages/services/Reporting'

// Legal pages
import Privacy from './pages/legal/Privacy'
import Terms from './pages/legal/Terms'
import Accessibility from './pages/legal/Accessibility'

const App: React.FC = () => {
  const { notifications, removeNotification, success, info } = useNotifications()

  // Demonstração de notificações
  React.useEffect(() => {
    const timer = setTimeout(() => {
      success(
        'Bem-vindo ao MINPERMAR',
        'Portal oficial do Ministério das Pescas e Recursos Marinhos de Angola',
        { duration: 8000 }
      )
    }, 2000)

    const timer2 = setTimeout(() => {
      info(
        'Sistema Atualizado',
        'Nova versão com funcionalidades avançadas disponível',
        { duration: 6000 }
      )
    }, 4000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
    }
  }, [success, info])

  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/pescas" element={<Fisheries />} />
          <Route path="/aquicultura" element={<Aquaculture />} />
          <Route path="/economia-azul" element={<BlueEconomy />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/educacao" element={<Education />} />
          <Route path="/estudos" element={<Studies />} />
          <Route path="/noticias" element={<News />} />
          <Route path="/transparencia" element={<Transparency />} />
          <Route path="/contacto" element={<Contact />} />
          
          {/* Service Routes */}
          <Route path="/servicos/licenciamento" element={<Licensing />} />
          <Route path="/servicos/certificacao" element={<Certification />} />
          <Route path="/servicos/consultoria" element={<Consultation />} />
          <Route path="/servicos/denuncias" element={<Reporting />} />
          
          {/* Legal Routes */}
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/acessibilidade" element={<Accessibility />} />
        </Routes>
      </main>
      
      <Footer />
      
      {/* Global Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

export default App
