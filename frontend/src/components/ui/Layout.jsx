import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import useSocketStore from '../../store/socketStore'
import { motion, AnimatePresence } from 'framer-motion'
import './Layout.css'

export default function Layout() {
  const fileGenerating = useSocketStore(s => s.fileGenerating)

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>

      {/* File generation overlay */}
      <AnimatePresence>
        {fileGenerating && (
          <motion.div
            className="file-gen-toast"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <div className="spinner" />
            <span>Generating {fileGenerating.type?.toUpperCase()}...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
