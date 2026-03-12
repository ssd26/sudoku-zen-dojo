import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

interface SidebarProps {
  currentRound: number
  completedRounds: number[]
  onSelectRound: (round: number) => void
}

const rounds = [
  { id: 1, name: 'The Canvas', icon: '1' },
  { id: 2, name: 'Row Flow', icon: '2' },
  { id: 3, name: 'Box Harmony', icon: '3' },
  { id: 4, name: 'Mini Puzzle', icon: '4' },
  { id: 5, name: 'Zen Master', icon: '5' },
]

export function Sidebar({ currentRound, completedRounds, onSelectRound }: SidebarProps) {
  const maxUnlocked = Math.max(1, ...completedRounds.map(r => r + 1))

  return (
    <aside className="w-56 bg-white/60 backdrop-blur-sm border-r border-lavender/30 p-4 flex flex-col gap-2">
      <h2 className="text-lg font-bold text-deep-plum mb-4 tracking-tight">
        Zen Dojo
      </h2>

      <nav className="flex flex-col gap-1.5">
        {rounds.map((round) => {
          const isCompleted = completedRounds.includes(round.id)
          const isActive = currentRound === round.id
          const isLocked = round.id > maxUnlocked

          return (
            <motion.button
              key={round.id}
              whileHover={!isLocked ? { x: 4 } : {}}
              whileTap={!isLocked ? { scale: 0.97 } : {}}
              onClick={() => !isLocked && onSelectRound(round.id)}
              disabled={isLocked}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors text-sm',
                isActive && 'bg-lavender/40 text-deep-plum font-semibold',
                !isActive && !isLocked && 'hover:bg-lavender/20 text-soft-charcoal',
                isLocked && 'opacity-40 cursor-not-allowed text-warm-gray',
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                  isCompleted && 'bg-mint text-deep-plum',
                  isActive && !isCompleted && 'bg-lavender text-deep-plum',
                  !isActive && !isCompleted && 'bg-cream text-warm-gray',
                )}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  round.icon
                )}
              </span>
              <span className="truncate">{round.name}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-lavender/20">
        <p className="text-xs text-warm-gray text-center">
          {completedRounds.length}/5 rounds complete
        </p>
      </div>
    </aside>
  )
}
