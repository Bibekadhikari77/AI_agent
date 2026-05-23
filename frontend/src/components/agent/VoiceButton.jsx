import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Square } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import useSocketStore from '../../store/socketStore'
import toast from 'react-hot-toast'
import './VoiceButton.css'

export default function VoiceButton() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorder = useRef(null)
  const speechRecognizer = useRef(null)
  const audioChunks = useRef([])
  const timerRef = useRef(null)
  const { sendVoiceMessage, sendMessage, sending } = useChatStore()
  const { socket } = useSocketStore()

  const getSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    return SR
  }

  const startRecording = useCallback(async () => {
    try {
      // Prefer browser speech-to-text so voice works without server-side transcription.
      const SR = getSpeechRecognition()
      if (SR) {
        const recognizer = new SR()
        recognizer.lang = 'en-US'
        recognizer.interimResults = false
        recognizer.maxAlternatives = 1

        recognizer.onresult = async (event) => {
          const transcript = event.results?.[0]?.[0]?.transcript?.trim()
          if (transcript) {
            await sendMessage(transcript, 'voice')
          } else {
            toast.error('Could not understand audio. Please try again.')
          }
        }

        recognizer.onerror = (event) => {
          const msg = event?.error === 'not-allowed'
            ? 'Microphone permission denied. Please allow access.'
            : `Voice error: ${event?.error || 'unknown'}`
          toast.error(msg)
        }

        recognizer.onend = () => {
          clearInterval(timerRef.current)
          setIsRecording(false)
          setDuration(0)
          speechRecognizer.current = null
          socket?.emit?.('voice:stop')
        }

        speechRecognizer.current = recognizer
        socket?.emit?.('voice:start')
        recognizer.start()

        setIsRecording(true)
        setDuration(0)
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      
      audioChunks.current = []
      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        
        if (blob.size < 1000) {
          toast.error('Recording too short — please try again')
          return
        }

        await sendVoiceMessage(blob)
      }

      socket?.emit?.('voice:start')
      recorder.start(100)
      mediaRecorder.current = recorder
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)

      // Auto-stop at 60 seconds
      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          stopRecording()
        }
      }, 60000)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow access.')
      } else {
        toast.error(`Mic error: ${err.message}`)
      }
    }
  }, [sendVoiceMessage])

  const stopRecording = useCallback(() => {
    if (speechRecognizer.current) {
      try { speechRecognizer.current.stop() } catch {}
      speechRecognizer.current = null
    }
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
    clearInterval(timerRef.current)
    setIsRecording(false)
    setDuration(0)
    socket?.emit?.('voice:stop')
  }, [])

  const handleClick = () => {
    if (sending) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="voice-container">
      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            className="recording-indicator"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
          >
            <div className="rec-dot" />
            <span>{formatDuration(duration)}</span>
            <div className="voice-waves">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        id="voice-record-btn"
        className={`voice-btn ${isRecording ? 'recording' : ''} ${sending ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={sending}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {/* Ripple effect when recording */}
        {isRecording && (
          <>
            <motion.div
              className="ripple"
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="ripple"
              animate={{ scale: [1, 2], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
        {isRecording ? <Square size={17} fill="currentColor" /> : <Mic size={17} />}
      </motion.button>
    </div>
  )
}
