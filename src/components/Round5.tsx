import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Numble } from './Numble'
import { Confetti } from './Confetti'
import { cn } from '../lib/cn'
import { generate9x9, findHintCell, type Puzzle9x9 } from '../lib/sudoku9x9'
import { playTap, playGentleWrong, playPlop, playSuccess, playHint } from '../lib/sounds'
import { StickyNote, Pencil, Lightbulb } from 'lucide-react'

const MESSAGES = {
  intro: "This is it -- the full 9x9. Everything you've learned comes together here. Take your time. Breathe. You also have Hints now -- Numble will whisper when you need a nudge.",
  firstCorrect: "Smooth. You're in the zone.",
  quarter: "A quarter done. The patterns are emerging...",
  halfway: "Halfway there! You're reading the grid like a poem now.",
  threeQuarter: "Almost there. The final pieces are falling into place.",
  hint: "Here's a whisper: look at the highlighted cell. I see only one number that fits there.",
  hintUsed: "No shame in hints -- even masters ask the wind for direction.",
  wrong: "That number already appears in this row, column, or box. Look around gently.",
  complete: "You are the Zen Master. The grid sings in perfect harmony.",
}

interface Round5Props {
  onComplete: () => void
}

export function Round5({ onComplete }: Round5Props) {
  const [puzzle] = useState<Puzzle9x9>(() => generate9x9(40))
  const [userValues, setUserValues] = useState<Record<string, number | null>>({})
  const [notes, setNotes] = useState<Record<string, Set<number>>>({})
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [shakeCell, setShakeCell] = useState<string | null>(null)
  const [hintCell, setHintCell] = useState<string | null>(null)
  const [message, setMessage] = useState(MESSAGES.intro)
  const [numbleMood, setNumbleMood] = useState<'happy' | 'thinking' | 'celebrating'>('happy')
  const [showConfetti, setShowConfetti] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)

  const key = (r: number, c: number) => `${r},${c}`

  const isBlank = useCallback((r: number, c: number) => {
    return puzzle.clues[r][c] === 0
  }, [puzzle])

  const cellValue = useCallback((r: number, c: number): number | null => {
    const clue = puzzle.clues[r][c]
    if (clue !== 0) return clue
    return userValues[key(r, c)] ?? null
  }, [puzzle, userValues])

  const hasConflict = useCallback((r: number, c: number, num: number) => {
    for (let cc = 0; cc < 9; cc++) {
      if (cc === c) continue
      if (cellValue(r, cc) === num) return true
    }
    for (let rr = 0; rr < 9; rr++) {
      if (rr === r) continue
      if (cellValue(rr, c) === num) return true
    }
    const boxRow = Math.floor(r / 3) * 3
    const boxCol = Math.floor(c / 3) * 3
    for (let rr = boxRow; rr < boxRow + 3; rr++) {
      for (let cc = boxCol; cc < boxCol + 3; cc++) {
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
    return puzzle.blanks.every(([r, c]) => {
      const val = newValues[key(r, c)]
      return val !== null && val !== undefined
    })
  }, [puzzle])

  const handleCellClick = useCallback((r: number, c: number) => {
    if (!isBlank(r, c) || roundComplete) return
    setSelectedCell([r, c])
    setHintCell(null)
    playTap()
  }, [isBlank, roundComplete])

  const handleNumberPick = useCallback((num: number) => {
    if (!selectedCell || roundComplete) return
    const [r, c] = selectedCell
    const k = key(r, c)

    if (notesMode) {
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

    playPlop()
    const newValues = { ...userValues, [k]: num }
    setUserValues(newValues)
    setSelectedCell(null)
    setNotes(prev => {
      const next = { ...prev }
      delete next[k]
      return next
    })

    const newFilled = Object.values(newValues).filter(v => v !== null).length
    const pct = newFilled / totalBlanks

    if (newFilled === 1) {
      setMessage(MESSAGES.firstCorrect)
    } else if (pct >= 0.75 && pct < 0.9) {
      setMessage(MESSAGES.threeQuarter)
    } else if (pct >= 0.5 && pct < 0.75) {
      setMessage(MESSAGES.halfway)
    } else if (pct >= 0.25 && pct < 0.5) {
      setMessage(MESSAGES.quarter)
    }

    if (checkComplete(newValues)) {
      setRoundComplete(true)
      setShowConfetti(true)
      setMessage(MESSAGES.complete)
      setNumbleMood('celebrating')
      playSuccess()
      setTimeout(() => setShowConfetti(false), 4000)
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

  const handleHint = useCallback(() => {
    if (roundComplete) return
    const hint = findHintCell(puzzle.clues, userValues)
    if (hint) {
      const k = key(hint.row, hint.col)
      setHintCell(k)
      setSelectedCell([hint.row, hint.col])
      setHintsUsed(prev => prev + 1)
      setMessage(hintsUsed === 0 ? MESSAGES.hint : MESSAGES.hintUsed)
      setNumbleMood('thinking')
      playHint()
      setTimeout(() => setNumbleMood('happy'), 2000)
    }
  }, [puzzle, userValues, roundComplete, hintsUsed])

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-deep-plum">Round 5: Zen Master</h1>
        <p className="text-warm-gray text-sm mt-1">The full 9x9. You are ready.</p>
      </motion.div>

      {/* Progress */}
      <div className="w-80">
        <div className="flex justify-between text-xs text-warm-gray mb-1.5">
          <span>Cells filled</span>
          <span>{filledCount}/{totalBlanks}</span>
        </div>
        <div className="h-2.5 bg-lavender/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-deep-plum/60 to-rose rounded-full"
            animate={{ width: `${(filledCount / totalBlanks) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      {/* Toolbar */}
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

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleHint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-peach/40 text-warm-gray hover:border-peach/70 transition-colors"
        >
          <Lightbulb size={16} />
          Hint
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

      {/* 9x9 Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-grid grid-cols-9 gap-0 rounded-2xl overflow-hidden shadow-lg border-2 border-deep-plum/20 bg-white"
      >
        {Array.from({ length: 81 }, (_, i) => {
          const r = Math.floor(i / 9)
          const c = i % 9
          const k = key(r, c)
          const clue = puzzle.clues[r][c]
          const isGiven = clue !== 0
          const userVal = userValues[k]
          const cellNotes = notes[k]
          const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c
          const isShaking = shakeCell === k
          const isHinted = hintCell === k
          const isFilled = !isGiven && userVal !== null && userVal !== undefined

          let isRelated = false
          if (selectedCell) {
            const [sr, sc] = selectedCell
            isRelated =
              (r === sr || c === sc ||
                (Math.floor(r / 3) === Math.floor(sr / 3) &&
                  Math.floor(c / 3) === Math.floor(sc / 3))) &&
              !(r === sr && c === sc)
          }

          // Highlight cells with same number as selected
          let isSameNumber = false
          if (selectedCell) {
            const selVal = cellValue(selectedCell[0], selectedCell[1])
            if (selVal && cellValue(r, c) === selVal && !(r === selectedCell[0] && c === selectedCell[1])) {
              isSameNumber = true
            }
          }

          const borderRight = c === 2 || c === 5
          const borderBottom = r === 2 || r === 5

          return (
            <motion.button
              key={i}
              animate={
                isShaking
                  ? { x: [0, -3, 3, -3, 3, 0] }
                  : {}
              }
              transition={isShaking ? { duration: 0.4 } : {}}
              whileHover={!isGiven && !roundComplete ? { scale: 1.05, zIndex: 10 } : {}}
              whileTap={!isGiven && !roundComplete ? { scale: 0.95 } : {}}
              onClick={() => handleCellClick(r, c)}
              className={cn(
                'w-11 h-11 flex items-center justify-center text-base font-bold transition-colors relative',
                'border-r border-b border-lavender/15',
                borderRight && 'border-r-2 border-r-deep-plum/20',
                borderBottom && 'border-b-2 border-b-deep-plum/20',
                c === 8 && 'border-r-0',
                r === 8 && 'border-b-0',
                // Base
                isGiven && 'bg-white text-deep-plum',
                !isGiven && !isFilled && !isSelected && !isRelated && 'bg-white',
                // Related highlighting
                isRelated && !isSelected && !isSameNumber && 'bg-lavender/8',
                isSameNumber && !isSelected && 'bg-lavender/20',
                // Selected
                isSelected && 'bg-lavender/30 ring-2 ring-lavender ring-inset',
                // Filled by user
                isFilled && !isSelected && 'bg-mint/15 text-deep-plum',
                isFilled && isSelected && 'bg-lavender/30 text-deep-plum ring-2 ring-lavender ring-inset',
                // Hint glow
                isHinted && !isSelected && 'bg-peach/30',
                isHinted && isSelected && 'bg-peach/40 ring-2 ring-peach ring-inset',
                // Clickable
                !isGiven && !roundComplete && 'cursor-pointer',
              )}
            >
              {isGiven && <span>{clue}</span>}
              {isFilled && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {userVal}
                </motion.span>
              )}
              {!isGiven && !isFilled && cellNotes && cellNotes.size > 0 && (
                <div className="grid grid-cols-3 gap-0 absolute inset-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <span
                      key={n}
                      className={cn(
                        'text-[8px] leading-none flex items-center justify-center',
                        cellNotes.has(n) ? 'text-deep-plum/40' : 'text-transparent',
                      )}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Number Picker */}
      {selectedCell && !roundComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-xs text-warm-gray">
            {notesMode ? 'Toggle notes' : 'Pick a number'}
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNumberPick(num)}
                className={cn(
                  'w-10 h-10 rounded-xl font-bold text-sm transition-colors',
                  notesMode
                    ? 'bg-sky/10 border border-sky/40 text-deep-plum hover:bg-sky/25 shadow-sm cursor-pointer'
                    : 'bg-white border border-lavender/30 text-deep-plum hover:bg-lavender/15 shadow-sm cursor-pointer',
                )}
              >
                {num}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Numble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-lg"
      >
        <Numble message={message} mood={numbleMood} />
      </motion.div>

      {/* Completion */}
      <AnimatePresence>
        {roundComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-sm text-warm-gray">
              {hintsUsed === 0
                ? 'Completed with no hints!'
                : `Completed with ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}`}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              className="px-6 py-3 bg-gradient-to-r from-deep-plum/80 to-rose text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              Complete the Dojo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
