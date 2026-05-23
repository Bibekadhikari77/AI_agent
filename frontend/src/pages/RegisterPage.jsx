import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import './AuthPages.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const { register, loading } = useAuthStore()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await register(form.name, form.email, form.password)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
        <div className="auth-blob blob-3" />
      </div>

      <motion.div
        className="auth-card glass"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="gradient-text">ARIA</h1>
            <p>AI Desktop Agent</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Create your account</h2>
          <p>Start automating with ARIA today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <div className="input-wrap">
              <User size={15} className="input-icon" />
              <input id="reg-name" type="text" className="input" placeholder="John Doe"
                value={form.name} onChange={set('name')} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-wrap">
              <Mail size={15} className="input-icon" />
              <input id="reg-email" type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-wrap">
              <Lock size={15} className="input-icon" />
              <input id="reg-password" type={showPass ? 'text' : 'password'} className="input"
                placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary auth-submit"
            id="register-submit-btn"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <><div className="spinner" /><span>Creating account...</span></>
            ) : (
              <><span>Create Account</span><ArrowRight size={16} /></>
            )}
          </motion.button>
        </form>

        <p className="auth-link-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in →</Link>
        </p>
      </motion.div>
    </div>
  )
}
