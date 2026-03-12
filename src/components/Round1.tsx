import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SudokuGrid } from './SudokuGrid'
import { Numble } from './Numble'
import { Confetti } from './Confetti'
import { playTap, playHighlight, playSuccess } from '../lib/sounds'

const REQUIRED_CELLS = 15

const MESSAGES = [
  { threshold: 0, text: "Welcome to the Dojo! This is your Sudoku canvas -- a 9x9 grid. Click any cell to feel its pulse." },
  { threshold: 1, text: "Beautiful! See how the cell lights up? Every cell has a home -- a row, a column, and a box." },
  { threshold: 3, text: "You're getting the feel! The grid has 9 rows going across..." },
  { threshold: 6, text: "...and 9 columns going down. Try clicking cells in different areas!" },
  { threshold: 9, text: "Notice the thicker lines? They mark the 3x3 boxes -- 9 cozy neighborhoods." },
  { threshold: 12, text: "Almost there! Just a few more cells to explore..." },
  { threshold: REQUIRED_CELLS, text: "" },
]

interface Round1Props {
  onComplete: () => void
  initialCells: number[]
}

export function Round1({ onComplete, initialCells }: Round1Props) {
  const [highlightedCells, setHighlightedCells] = useState<Set<number>>(
    () => new Set(initialCells)
  )
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const uniqueCount = highlightedCells.size

  const currentMessage = [...MESSAGES]
    .reverse()
    .find(m => uniqueCount >= m.threshold)

  const handleCellClick = useCallback((index: number) => {
    if (completed) return

    setSelectedCell(index)

    if (!highlightedCells.has(index)) {
      playTap()
      setHighlightedCells(prev => {
        const next = new Set(prev)
        next.add(index)
        return next
      })
    } else {
      playHighlight()
    }
  }, [completed, highlightedCells])

  useEffect(() => {
    if (uniqueCount >= REQUIRED_CELLS && !completed) {
      setCompleted(true)
      setShowConfetti(true)
      playSuccess()
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [uniqueCount, completed])

  const numbleMood = completed ? 'celebrating' : uniqueCount > 8 ? 'thinking' : 'happy'

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-deep-plum">Round 1: The Canvas</h1>
        <p className="text-warm-gray text-sm mt-1">Explore the grid by clicking cells</p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-72">
        <div className="flex justify-between text-xs text-warm-gray mb-1.5">
          <span>Cells explored</span>
          <span>{Math.min(uniqueCount, REQUIRED_CELLS)}/{REQUIRED_CELLS}</span>
        </div>
        <div className="h-2.5 bg-lavender/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-lavender to-sky rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((uniqueCount / REQUIRED_CELLS) * 100, 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <SudokuGrid
          highlightedCells={highlightedCells}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
        />
      </motion.div>

      {/* Numble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-lg"
      >
        <Numble
          message={
            completed
              ? "You feel the rhythm. The canvas is alive! You've unlocked Round 2."
              : currentMessage?.text || ''
          }
          mood={numbleMood}
        />
      </motion.div>

      {/* Unlock button */}
      <AnimatePresence>
        {completed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="px-6 py-3 bg-gradient-to-r from-lavender to-sky text-deep-plum font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            Continue to Round 2
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
