import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AlertBanner from './AlertBanner'
import ChatbotWidget from '../chatbot/ChatbotWidget'
import { useAlerts } from '../../hooks/useAlerts'

export default function Layout() {
  const { data: alerts } = useAlerts()
  const criticalAlerts = alerts?.filter(a => a.severity === 'CRITICAL') ?? []

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden" style={{ minWidth: '1280px' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {criticalAlerts.length > 0 && <AlertBanner alerts={criticalAlerts} />}
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <ChatbotWidget />
    </div>
  )
}
