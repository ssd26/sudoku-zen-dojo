const STORAGE_KEY = 'sudoku-zen-dojo-progress'

export interface Progress {
  currentRound: number
  roundsCompleted: number[]
  round1CellsClicked: number[]
}

const DEFAULT_PROGRESS: Progress = {
  currentRound: 1,
  roundsCompleted: [],
  round1CellsClicked: [],
}

export function loadProgress(): Progress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PROGRESS }
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}
