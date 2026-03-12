import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Numble } from './Numble'
import { Confetti } from './Confetti'
import { cn } from '../lib/cn'
import { playTap, playGentleWrong, playPlop, playRowComplete, playSuccess } from '../lib/sounds'

const ROWS_TO_COMPLETE = 3

// Generate a valid shuffled row (1-9)
function generateRow(): number[] {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]]
  }
  return nums
}

// Pick 2-3 random indices to blank out
function generateBlanks(difficulty: number): number[] {
  const count = Math.min(2 + difficulty, 4)
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, count).sort((a, b) => a - b)
}

interface RowPuzzle {
  solution: number[]
  blanks: number[]
}

function createPuzzle(difficulty: number): RowPuzzle {
  return {
    solution: generateRow(),
    blanks: generateBlanks(difficulty),
  }
}

const MESSAGES = {
  intro: "Each row in Sudoku holds the numbers 1 through 9 -- no repeats allowed. Fill in the gaps!",
  firstFill: "Nice! See how each number appears exactly once? That's the Row Flow.",
  rowDone1: "Beautiful! One row complete. The numbers found their rhythm.",
  rowDone2: "Two down! You're feeling the flow now. One more to go!",
  wrong: "Hmm, that number's already in the row. Each number needs its own space.",
  complete: "Numbers like their own space. You've mastered the Row Flow!",
}

interface Round2Props {
  onComplete: () => void
}

export function Round2({ onComplete }: Round2Props) {
  const [rowsCompleted, setRowsCompleted] = useState(0)
  const [puzzle, setPuzzle] = useState(() => createPuzzle(0))
  const [userValues, setUserValues] = useState<Record<number, number | null>>({})
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null)
  const [shakeCell, setShakeCell] = useState<number | null>(null)
  const [message, setMessage] = useState(MESSAGES.intro)
  const [numbleMood, setNumbleMood] = useState<'happy' | 'thinking' | 'celebrating'>('happy')
  const [showConfetti, setShowConfetti] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [rowJustCompleted, setRowJustCompleted] = useState(false)
  const [totalFills, setTotalFills] = useState(0)

  // Numbers already placed in the row (given + user-filled)
  const placedNumbers = useMemo(() => {
    const placed = new Set<number>()
    puzzle.solution.forEach((num, i) => {
      if (!puzzle.blanks.includes(i)) {
        placed.add(num)
      }
    })
    Object.values(userValues).forEach(v => {
      if (v) placed.add(v)
    })
    return placed
  }, [puzzle, userValues])

  // Check if current row is fully and correctly filled
  const checkRowComplete = useCallback((newValues: Record<number, number | null>) => {
    return puzzle.blanks.every(bi => newValues[bi] === puzzle.solution[bi])
  }, [puzzle])

  const handleBlankClick = useCallback((blankIndex: number) => {
    if (rowJustCompleted || roundComplete) return
    setSelectedBlank(blankIndex)
    playTap()
  }, [rowJustCompleted, roundComplete])

  const handleNumberPick = useCallback((num: number) => {
    if (selectedBlank === null || rowJustCompleted || roundComplete) return

    const correctAnswer = puzzle.solution[selectedBlank]

    if (num === correctAnswer) {
      // Correct!
      playPlop()
      const newValues = { ...userValues, [selectedBlank]: num }
      setUserValues(newValues)
      setSelectedBlank(null)
      setTotalFills(prev => prev + 1)

      if (totalFills === 0) {
        setMessage(MESSAGES.firstFill)
      }

      // Check if row is complete
      if (checkRowComplete(newValues)) {
        const newCount = rowsCompleted + 1
        setRowsCompleted(newCount)
        setRowJustCompleted(true)
        playRowComplete()

        if (newCount >= ROWS_TO_COMPLETE) {
          // Round complete!
          setRoundComplete(true)
          setShowConfetti(true)
          setMessage(MESSAGES.complete)
          setNumbleMood('celebrating')
          playSuccess()
          setTimeout(() => setShowConfetti(false), 3000)
        } else {
          setMessage(newCount === 1 ? MESSAGES.rowDone1 : MESSAGES.rowDone2)
          setNumbleMood('celebrating')
          // Auto-advance to next row after a pause
          setTimeout(() => {
            setPuzzle(createPuzzle(newCount))
            setUserValues({})
            setSelectedBlank(null)
            setRowJustCompleted(false)
            setNumbleMood('happy')
          }, 1500)
        }
      }
    } else {
      // Wrong - gentle shake, no scolding
      playGentleWrong()
      setShakeCell(selectedBlank)
      setMessage(MESSAGES.wrong)
      setNumbleMood('thinking')
      setTimeout(() => {
        setShakeCell(null)
        setNumbleMood('happy')
      }, 500)
    }
  }, [selectedBlank, userValues, puzzle, checkRowComplete, rowsCompleted, rowJustCompleted, roundComplete, totalFills])

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-deep-plum">Round 2: Row Flow</h1>
        <p className="text-warm-gray text-sm mt-1">Fill each row with 1-9, no repeats</p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-72">
        <div className="flex justify-between text-xs text-warm-gray mb-1.5">
          <span>Rows completed</span>
          <span>{rowsCompleted}/{ROWS_TO_COMPLETE}</span>
        </div>
        <div className="h-2.5 bg-lavender/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mint to-sage rounded-full"
            animate={{ width: `${(rowsCompleted / ROWS_TO_COMPLETE) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      {/* The Row */}
      <motion.div
        key={`row-${rowsCompleted}`}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex gap-0 rounded-2xl overflow-hidden shadow-lg border-2 border-lavender/40 bg-white"
      >
        {puzzle.solution.map((num, i) => {
          const isBlank = puzzle.blanks.includes(i)
          const userVal = userValues[i]
          const isSelected = selectedBlank === i
          const isShaking = shakeCell === i
          const isFilled = isBlank && userVal !== undefined && userVal !== null

          return (
            <motion.button
              key={i}
              animate={
                isShaking
                  ? { x: [0, -4, 4, -4, 4, 0] }
                  : {}
              }
              transition={isShaking ? { duration: 0.4 } : {}}
              whileHover={isBlank && !isFilled ? { scale: 1.05, zIndex: 10 } : {}}
              whileTap={isBlank && !isFilled ? { scale: 0.95 } : {}}
              onClick={() => isBlank && !isFilled && handleBlankClick(i)}
              className={cn(
                'w-14 h-14 flex items-center justify-center text-lg font-bold transition-colors relative',
                'border-r border-lavender/20 last:border-r-0',
                // Given cell
                !isBlank && 'bg-white text-deep-plum',
                // Blank cell - unfilled
                isBlank && !isFilled && !isSelected && 'bg-sky/10 text-transparent cursor-pointer hover:bg-sky/25',
                // Blank cell - selected
                isBlank && !isFilled && isSelected && 'bg-lavender/40 ring-2 ring-lavender ring-inset',
                // Blank cell - correctly filled
                isFilled && 'bg-mint/30 text-deep-plum',
              )}
            >
              {!isBlank && (
                <span>{num}</span>
              )}
              {isBlank && isFilled && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {userVal}
                </motion.span>
              )}
              {isBlank && !isFilled && (
                <span className="text-lavender/50 text-sm">?</span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Number Picker */}
      <AnimatePresence>
        {selectedBlank !== null && !rowJustCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-xs text-warm-gray">Pick a number</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                const alreadyPlaced = placedNumbers.has(num)
                return (
                  <motion.button
                    key={num}
                    whileHover={!alreadyPlaced ? { scale: 1.1 } : {}}
                    whileTap={!alreadyPlaced ? { scale: 0.9 } : {}}
                    onClick={() => !alreadyPlaced && handleNumberPick(num)}
                    disabled={alreadyPlaced}
                    className={cn(
                      'w-10 h-10 rounded-xl font-bold text-sm transition-colors',
                      alreadyPlaced
                        ? 'bg-lavender/15 text-warm-gray/30 cursor-not-allowed'
                        : 'bg-white border border-lavender/40 text-deep-plum hover:bg-lavender/20 shadow-sm cursor-pointer',
                    )}
                  >
                    {num}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint: click a blank */}
      {selectedBlank === null && !rowJustCompleted && !roundComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-warm-gray"
        >
          Click a ? cell to fill it
        </motion.p>
      )}

      {/* Numble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
            className="px-6 py-3 bg-gradient-to-r from-mint to-sage text-deep-plum font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            Continue to Round 3
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
