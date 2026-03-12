import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Numble } from './Numble'
import { Confetti } from './Confetti'
import { cn } from '../lib/cn'
import { playTap, playGentleWrong, playPlop, playRowComplete, playSuccess } from '../lib/sounds'

const BOXES_TO_COMPLETE = 3

// Generate a valid shuffled 1-9 and lay it into a 3x3 grid
function generateBox(): number[] {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]]
  }
  return nums
}

function generateBlanks(difficulty: number): number[] {
  const count = Math.min(2 + difficulty, 5)
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, count).sort((a, b) => a - b)
}

interface BoxPuzzle {
  solution: number[]
  blanks: number[]
}

function createPuzzle(difficulty: number): BoxPuzzle {
  return {
    solution: generateBox(),
    blanks: generateBlanks(difficulty),
  }
}

const MESSAGES = {
  intro: "The grid has a secret: it's divided into nine 3x3 boxes. Each box must also hold 1 through 9. Let's practice!",
  firstFill: "You got it! Every box is its own little neighborhood -- no duplicate house numbers allowed.",
  boxDone1: "One box complete! The numbers are feeling right at home.",
  boxDone2: "Two boxes harmonized! One more and you'll feel the secret.",
  wrong: "That number already lives in this box. Try another -- everyone needs their own spot.",
  complete: "Secret clubs. Each box holds its own harmony. You've unlocked Round 4!",
}

interface Round3Props {
  onComplete: () => void
}

export function Round3({ onComplete }: Round3Props) {
  const [boxesCompleted, setBoxesCompleted] = useState(0)
  const [puzzle, setPuzzle] = useState(() => createPuzzle(0))
  const [userValues, setUserValues] = useState<Record<number, number | null>>({})
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null)
  const [shakeCell, setShakeCell] = useState<number | null>(null)
  const [message, setMessage] = useState(MESSAGES.intro)
  const [numbleMood, setNumbleMood] = useState<'happy' | 'thinking' | 'celebrating'>('happy')
  const [showConfetti, setShowConfetti] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [boxJustCompleted, setBoxJustCompleted] = useState(false)
  const [totalFills, setTotalFills] = useState(0)

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

  const checkBoxComplete = useCallback((newValues: Record<number, number | null>) => {
    return puzzle.blanks.every(bi => newValues[bi] === puzzle.solution[bi])
  }, [puzzle])

  const handleBlankClick = useCallback((blankIndex: number) => {
    if (boxJustCompleted || roundComplete) return
    setSelectedBlank(blankIndex)
    playTap()
  }, [boxJustCompleted, roundComplete])

  const handleNumberPick = useCallback((num: number) => {
    if (selectedBlank === null || boxJustCompleted || roundComplete) return

    const correctAnswer = puzzle.solution[selectedBlank]

    if (num === correctAnswer) {
      playPlop()
      const newValues = { ...userValues, [selectedBlank]: num }
      setUserValues(newValues)
      setSelectedBlank(null)
      setTotalFills(prev => prev + 1)

      if (totalFills === 0) {
        setMessage(MESSAGES.firstFill)
      }

      if (checkBoxComplete(newValues)) {
        const newCount = boxesCompleted + 1
        setBoxesCompleted(newCount)
        setBoxJustCompleted(true)
        playRowComplete()

        if (newCount >= BOXES_TO_COMPLETE) {
          setRoundComplete(true)
          setShowConfetti(true)
          setMessage(MESSAGES.complete)
          setNumbleMood('celebrating')
          playSuccess()
          setTimeout(() => setShowConfetti(false), 3000)
        } else {
          setMessage(newCount === 1 ? MESSAGES.boxDone1 : MESSAGES.boxDone2)
          setNumbleMood('celebrating')
          setTimeout(() => {
            setPuzzle(createPuzzle(newCount))
            setUserValues({})
            setSelectedBlank(null)
            setBoxJustCompleted(false)
            setNumbleMood('happy')
          }, 1500)
        }
      }
    } else {
      playGentleWrong()
      setShakeCell(selectedBlank)
      setMessage(MESSAGES.wrong)
      setNumbleMood('thinking')
      setTimeout(() => {
        setShakeCell(null)
        setNumbleMood('happy')
      }, 500)
    }
  }, [selectedBlank, userValues, puzzle, checkBoxComplete, boxesCompleted, boxJustCompleted, roundComplete, totalFills])

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-deep-plum">Round 3: Box Harmony</h1>
        <p className="text-warm-gray text-sm mt-1">Each 3x3 box holds 1-9, no repeats</p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-72">
        <div className="flex justify-between text-xs text-warm-gray mb-1.5">
          <span>Boxes completed</span>
          <span>{boxesCompleted}/{BOXES_TO_COMPLETE}</span>
        </div>
        <div className="h-2.5 bg-lavender/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-peach to-rose rounded-full"
            animate={{ width: `${(boxesCompleted / BOXES_TO_COMPLETE) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      {/* The 3x3 Box */}
      <motion.div
        key={`box-${boxesCompleted}`}
        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="inline-grid grid-cols-3 gap-0 rounded-2xl overflow-hidden shadow-lg border-2 border-peach/50 bg-white"
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
              whileHover={isBlank && !isFilled ? { scale: 1.08, zIndex: 10 } : {}}
              whileTap={isBlank && !isFilled ? { scale: 0.92 } : {}}
              onClick={() => isBlank && !isFilled && handleBlankClick(i)}
              className={cn(
                'w-16 h-16 flex items-center justify-center text-xl font-bold transition-colors relative',
                'border-r border-b border-peach/20',
                // Remove right border on last column
                i % 3 === 2 && 'border-r-0',
                // Remove bottom border on last row
                i >= 6 && 'border-b-0',
                // Given cell
                !isBlank && 'bg-white text-deep-plum',
                // Blank - unfilled
                isBlank && !isFilled && !isSelected && 'bg-peach/10 cursor-pointer hover:bg-peach/25',
                // Blank - selected
                isBlank && !isFilled && isSelected && 'bg-peach/30 ring-2 ring-peach ring-inset',
                // Blank - filled
                isFilled && 'bg-mint/30 text-deep-plum',
              )}
            >
              {!isBlank && <span>{num}</span>}
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
                <span className="text-peach/50 text-sm">?</span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Number Picker */}
      <AnimatePresence>
        {selectedBlank !== null && !boxJustCompleted && (
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
                        ? 'bg-peach/15 text-warm-gray/30 cursor-not-allowed'
                        : 'bg-white border border-peach/40 text-deep-plum hover:bg-peach/20 shadow-sm cursor-pointer',
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

      {/* Hint */}
      {selectedBlank === null && !boxJustCompleted && !roundComplete && (
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
            className="px-6 py-3 bg-gradient-to-r from-peach to-rose text-deep-plum font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            Continue to Round 4
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
