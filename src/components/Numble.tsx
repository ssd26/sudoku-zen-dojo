import { motion, AnimatePresence } from 'framer-motion'

interface NumbleProps {
  message: string
  mood?: 'happy' | 'thinking' | 'celebrating'
}

export function Numble({ message, mood = 'happy' }: NumbleProps) {
  const eyeStyle = mood === 'celebrating' ? 'scale-y-0' : ''
  const bodyColor = mood === 'celebrating'
    ? 'from-rose to-peach'
    : mood === 'thinking'
      ? 'from-lavender to-sky'
      : 'from-mint to-sky'

  return (
    <div className="flex items-end gap-3">
      {/* Numble character - geometric spirit */}
      <motion.div
        className="flex-shrink-0"
        animate={
          mood === 'celebrating'
            ? { rotate: [0, -5, 5, -5, 0], scale: [1, 1.1, 1] }
            : { y: [0, -3, 0] }
        }
        transition={
          mood === 'celebrating'
            ? { duration: 0.6, repeat: 2 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          {/* Body - rounded diamond shape */}
          <motion.path
            d="M24 4 L42 24 L24 44 L6 24 Z"
            className={`fill-current`}
            style={{
              fill: mood === 'celebrating'
                ? '#F8C8D4'
                : mood === 'thinking'
                  ? '#E6E0F3'
                  : '#D4EDDA',
            }}
            rx="8"
            strokeWidth="2"
            stroke="#9B8F8F"
            strokeLinejoin="round"
          />
          {/* Eyes */}
          <circle
            cx="18" cy="22" r="2.5"
            fill="#4A3B5C"
            className={eyeStyle}
          />
          <circle
            cx="30" cy="22" r="2.5"
            fill="#4A3B5C"
            className={eyeStyle}
          />
          {/* Smile */}
          {mood === 'celebrating' ? (
            <path d="M18 28 Q24 34 30 28" stroke="#4A3B5C" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M20 28 Q24 31 28 28" stroke="#4A3B5C" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          {/* Blush */}
          <circle cx="14" cy="27" r="3" fill="#F8C8D4" opacity="0.5" />
          <circle cx="34" cy="27" r="3" fill="#F8C8D4" opacity="0.5" />
        </svg>
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-lavender/50 max-w-md"
        >
          <p className="text-sm text-soft-charcoal leading-relaxed">{message}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
