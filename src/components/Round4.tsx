import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Numble } from './Numble'
import { Confetti } from './Confetti'
import { cn } from '../lib/cn'
import { generate6x6, type Puzzle6x6 } from '../lib/sudoku6x6'
import { playTap, playGentleWrong, playPlop, playSuccess } from '../lib/sounds'
import { StickyNote, Pencil } from 'lucide-react'

const MESSAGES = {
  intro: "Now it all comes together! This is a real mini Sudoku -- 6x6. Rows, columns, AND boxes all matter. I've also taught you something new: Notes mode!",
  notesExplain: "Toggle Notes mode with the pencil button. In Notes mode, clicking a number adds a small reminder to the cell instead of filling it in. Great for working things out!",
  firstCorrect: "That's the flow! Every number must be unique in its row, column, and box.",
  halfway: "You're halfway there! The rules are dancing together beautifully.",
  wrong: "Hmm, that number conflicts with something in the same row, column, or box. Take a breath and look around.",
  almostDone: "Almost there! Just a few cells left...",
  complete: "Rules dance together. You've solved your first real puzzle!",
}

interface Round4Props {
  onComplete: () => void
}

export function Round4({ onComplete }: Round4Props) {
  const [puzzle] = useState<Puzzle6x6>(() => generate6x6(14))
  const [userValues, setUserValues] = useState<Record<string, number | null>>({})
  const [notes, setNotes] = useState<Record<string, Set<number>>>({})
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [shakeCell, setShakeCell] = useState<string | null>(null)
  const [message, setMessage] = useState(MESSAGES.intro)
  const [numbleMood, setNumbleMood] = useState<'happy' | 'thinking' | 'celebrating'>('happy')
  const [showConfetti, setShowConfetti] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [hasShownNotesHint, setHasShownNotesHint] = useState(false)

  const key = (r: number, c: number) => `${r},${c}`

  const isBlank = useCallback((r: number, c: number) => {
    return puzzle.clues[r][c] === 0
  }, [puzzle])

  // Get the effective value of a cell (clue or user-filled)
  const cellValue = useCallback((r: number, c: number): number | null => {
    const clue = puzzle.clues[r][c]
    if (clue !== 0) return clue
    return userValues[key(r, c)] ?? null
  }, [puzzle, userValues])

  // Check if placing num at (r,c) conflicts with current state
  const hasConflict = useCallback((r: number, c: number, num: number) => {
    // Check row
    for (let cc = 0; cc < 6; cc++) {
      if (cc === c) continue
      if (cellValue(r, cc) === num) return true
    }
    // Check column
    for (let rr = 0; rr < 6; rr++) {
      if (rr === r) continue
      if (cellValue(rr, c) === num) return true
    }
    // Check 3x2 box (3 rows x 2 cols)
    const boxRow = Math.floor(r / 3) * 3
    const boxCol = Math.floor(c / 2) * 2
    for (let rr = boxRow; rr < boxRow + 3; rr++) {
      for (let cc = boxCol; cc < boxCol + 2; cc++) {
        if (rr === r && cc === c) continue
        if (cellValue(rr, cc) === num) return true
      }
    }
    return false
  }, [cellValue])

  const filledCount = useMemo(() => {
    return Object.values(userValues).filter(v => v !== null).length
  }, [userValues])

  const totalBlanks = puzzle.blanks.length

  const checkComplete = useCallback((newValues: Record<string, number | null>) => {
    // Unique solution is guaranteed, so just check all blanks are filled
    return puzzle.blanks.every(([r, c]) => {
      const val = newValues[key(r, c)]
      return val !== null && val !== undefined
    })
  }, [puzzle])

  const handleCellClick = useCallback((r: number, c: number) => {
    if (!isBlank(r, c) || roundComplete) return
    // If cell already filled, allow clearing by re-selecting
    setSelectedCell([r, c])
    playTap()

    if (!hasShownNotesHint && filledCount >= 2) {
      setMessage(MESSAGES.notesExplain)
      setHasShownNotesHint(true)
    }
  }, [isBlank, roundComplete, hasShownNotesHint, filledCount])

  const handleNumberPick = useCallback((num: number) => {
    if (!selectedCell || roundComplete) return
    const [r, c] = selectedCell
    const k = key(r, c)

    if (notesMode) {
      // Toggle note
      setNotes(prev => {
        const next = { ...prev }
        const cellNotes = new Set(prev[k] || [])
        if (cellNotes.has(num)) {
          cellNotes.delete(num)
        } else {
          cellNotes.add(num)
        }
        next[k] = cellNotes
        return next
      })
      playTap()
      return
    }

    // Filling mode
    if (hasConflict(r, c, num)) {
      playGentleWrong()
      setShakeCell(k)
      setMessage(MESSAGES.wrong)
      setNumbleMood('thinking')
      setTimeout(() => {
        setShakeCell(null)
        setNumbleMood('happy')
      }, 500)
      return
    }

    // Place the number
    playPlop()
    const newValues = { ...userValues, [k]: num }
    setUserValues(newValues)
    setSelectedCell(null)
    // Clear notes for this cell
    setNotes(prev => {
      const next = { ...prev }
      delete next[k]
      return next
    })

    const newFilled = Object.values(newValues).filter(v => v !== null).length

    if (newFilled === 1) {
      setMessage(MESSAGES.firstCorrect)
    } else if (newFilled >= Math.floor(totalBlanks / 2) && newFilled < totalBlanks - 2) {
      setMessage(MESSAGES.halfway)
    } else if (newFilled >= totalBlanks - 2 && newFilled < totalBlanks) {
      setMessage(MESSAGES.almostDone)
    }

    if (checkComplete(newValues)) {
      setRoundComplete(true)
      setShowConfetti(true)
      setMessage(MESSAGES.complete)
      setNumbleMood('celebrating')
      playSuccess()
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [selectedCell, notesMode, hasConflict, userValues, totalBlanks, checkComplete, roundComplete])

  const handleClearCell = useCallback(() => {
    if (!selectedCell || roundComplete) return
    const [r, c] = selectedCell
    const k = key(r, c)
    if (userValues[k]) {
      setUserValues(prev => {
        const next = { ...prev }
        delete next[k]
        return next
      })
    }
    setNotes(prev => {
      const next = { ...prev }
      delete next[k]
      return next
    })
  }, [selectedCell, userValues, roundComplete])

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-deep-plum">Round 4: Mini Puzzle</h1>
        <p className="text-warm-gray text-sm mt-1">Solve the 6x6 Sudoku -- rows, columns, and boxes</p>
      </motion.div>

      {/* Progress */}
      <div className="w-72">
        <div className="flex justify-between text-xs text-warm-gray mb-1.5">
          <span>Cells filled</span>
          <span>{filledCount}/{totalBlanks}</span>
        </div>
        <div className="h-2.5 bg-lavender/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky to-lavender rounded-full"
            animate={{ width: `${(filledCount / totalBlanks) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      {/* Notes mode toggle */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setNotesMode(!notesMode)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
            notesMode
              ? 'bg-sky/40 text-deep-plum border-2 border-sky'
              : 'bg-white border-2 border-lavender/30 text-warm-gray hover:border-sky/50',
          )}
        >
          {notesMode ? <StickyNote size={16} /> : <Pencil size={16} />}
          {notesMode ? 'Notes ON' : 'Notes OFF'}
        </motion.button>

        {selectedCell && userValues[key(selectedCell[0], selectedCell[1])] && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearCell}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-rose/30 text-warm-gray hover:border-rose/50 transition-colors"
          >
            Clear
          </motion.button>
        )}
      </div>

      {/* 6x6 Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="inline-grid grid-cols-6 gap-0 rounded-2xl overflow-hidden shadow-lg border-2 border-sky/40 bg-white"
      >
        {Array.from({ length: 36 }, (_, i) => {
          const r = Math.floor(i / 6)
          const c = i % 6
          const k = key(r, c)
          const clue = puzzle.clues[r][c]
          const isGiven = clue !== 0
          const userVal = userValues[k]
          const cellNotes = notes[k]
          const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c
          const isShaking = shakeCell === k
          const isFilled = !isGiven && userVal !== null && userVal !== undefined

          // Highlight row/col/box of selected cell
          let isRelated = false
          if (selectedCell) {
            const [sr, sc] = selectedCell
            const sameRow = r === sr
            const sameCol = c === sc
            const sameBox =
              Math.floor(r / 3) === Math.floor(sr / 3) &&
              Math.floor(c / 2) === Math.floor(sc / 2)
            isRelated = (sameRow || sameCol || sameBox) && !(r === sr && c === sc)
          }

          // Box borders: 3x2 boxes (3 rows x 2 cols)
          const borderRight = c === 1 || c === 3
          const borderBottom = r === 2

          return (
            <motion.button
              key={i}
              animate={
                isShaking
                  ? { x: [0, -4, 4, -4, 4, 0] }
                  : {}
              }
              transition={isShaking ? { duration: 0.4 } : {}}
              whileHover={!isGiven && !roundComplete ? { scale: 1.05, zIndex: 10 } : {}}
              whileTap={!isGiven && !roundComplete ? { scale: 0.95 } : {}}
              onClick={() => handleCellClick(r, c)}
              className={cn(
                'w-14 h-14 flex items-center justify-center text-lg font-bold transition-colors relative',
                'border-r border-b border-sky/15',
                borderRight && 'border-r-2 border-r-sky/40',
                borderBottom && 'border-b-2 border-b-sky/40',
                c === 5 && 'border-r-0',
                r === 5 && 'border-b-0',
                // States
                isGiven && 'bg-white text-deep-plum',
                !isGiven && !isFilled && !isSelected && !isRelated && 'bg-white',
                isRelated && !isSelected && 'bg-sky/8',
                isSelected && 'bg-sky/25 ring-2 ring-sky ring-inset',
                isFilled && !isSelected && 'bg-mint/20 text-deep-plum',
                isFilled && isSelected && 'bg-sky/25 text-deep-plum ring-2 ring-sky ring-inset',
                !isGiven && !isFilled && 'cursor-pointer',
              )}
            >
              {isGiven && <span>{clue}</span>}
              {isFilled && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="text-deep-plum"
                >
                  {userVal}
                </motion.span>
              )}
              {!isGiven && !isFilled && cellNotes && cellNotes.size > 0 && (
                <div className="grid grid-cols-3 gap-0 absolute inset-1">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <span
                      key={n}
                      className={cn(
                        'text-[9px] flex items-center justify-center',
                        cellNotes.has(n) ? 'text-sky/70' : 'text-transparent',
                      )}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
              {!isGiven && !isFilled && (!cellNotes || cellNotes.size === 0) && (
                <span className="text-sky/20 text-xs"></span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Number Picker */}
      <div className="flex flex-col items-center gap-2">
        {selectedCell && !roundComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-xs text-warm-gray">
              {notesMode ? 'Toggle notes' : 'Pick a number'}
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNumberPick(num)}
                  className={cn(
                    'w-11 h-11 rounded-xl font-bold text-sm transition-colors',
                    notesMode
                      ? 'bg-sky/10 border border-sky/40 text-deep-plum hover:bg-sky/25 shadow-sm cursor-pointer'
                      : 'bg-white border border-lavender/40 text-deep-plum hover:bg-lavender/20 shadow-sm cursor-pointer',
                  )}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Numble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-lg"
      >
        <Numble message={message} mood={numbleMood} />
      </motion.div>

      {/* Continue button */}
      <AnimatePresence>
        {roundComplete && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="px-6 py-3 bg-gradient-to-r from-sky to-lavender text-deep-plum font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            Continue to Round 5
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
