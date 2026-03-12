import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Round1 } from './components/Round1'
import { Round2 } from './components/Round2'
import { Round3 } from './components/Round3'
import { Round4 } from './components/Round4'
import { Round5 } from './components/Round5'
import { loadProgress, saveProgress } from './lib/progress'
import './App.css'

function App() {
  const [progress, setProgress] = useState(loadProgress)

  const handleSelectRound = useCallback((round: number) => {
    setProgress(prev => {
      const next = { ...prev, currentRound: round }
      saveProgress(next)
      return next
    })
  }, [])

  const completeRound = useCallback((round: number) => {
    setProgress(prev => {
      const next = {
        ...prev,
        roundsCompleted: prev.roundsCompleted.includes(round)
          ? prev.roundsCompleted
          : [...prev.roundsCompleted, round],
        currentRound: round + 1,
      }
      saveProgress(next)
      return next
    })
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentRound={progress.currentRound}
        completedRounds={progress.roundsCompleted}
        onSelectRound={handleSelectRound}
      />

      <main className="flex-1 flex items-center justify-center p-8 overflow-auto">
        {progress.currentRound === 1 && (
          <Round1
            onComplete={() => completeRound(1)}
            initialCells={progress.round1CellsClicked}
          />
        )}

        {progress.currentRound === 2 && (
          <Round2
            onComplete={() => completeRound(2)}
          />
        )}

        {progress.currentRound === 3 && (
          <Round3
            onComplete={() => completeRound(3)}
          />
        )}

        {progress.currentRound === 4 && (
          <Round4
            onComplete={() => completeRound(4)}
          />
        )}

        {progress.currentRound === 5 && (
          <Round5
            onComplete={() => completeRound(5)}
          />
        )}

        {progress.currentRound >= 6 && (
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-5xl">
                <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4 L42 24 L24 44 L6 24 Z" fill="#D4EDDA" stroke="#9B8F8F" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="18" cy="22" r="2.5" fill="#4A3B5C" className="scale-y-0"/>
                  <circle cx="30" cy="22" r="2.5" fill="#4A3B5C" className="scale-y-0"/>
                  <path d="M18 28 Q24 34 30 28" stroke="#4A3B5C" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <circle cx="14" cy="27" r="3" fill="#F8C8D4" opacity="0.5"/>
                  <circle cx="34" cy="27" r="3" fill="#F8C8D4" opacity="0.5"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-deep-plum">You are the Zen Master</h2>
              <p className="text-warm-gray max-w-sm">
                You've completed all 5 rounds of the Dojo. The grid holds no more mysteries for you. Return anytime to practice.
              </p>
              <button
                onClick={() => handleSelectRound(1)}
                className="mt-2 px-5 py-2.5 bg-white border-2 border-lavender/40 text-deep-plum font-semibold rounded-xl hover:bg-lavender/10 transition-colors"
              >
                Play again from Round 1
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
