// 9x9 Sudoku: numbers 1-9, 3x3 boxes

type Grid = number[][]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false
    }
  }
  return true
}

function solve(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num
            if (solve(grid)) return true
            grid[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

// Count solutions up to limit (for uniqueness check)
function countSolutions(grid: Grid, limit: number = 2): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let count = 0
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num
            count += countSolutions(grid, limit - count)
            grid[r][c] = 0
            if (count >= limit) return count
          }
        }
        return count
      }
    }
  }
  return 1
}

export interface Puzzle9x9 {
  solution: number[][]
  clues: number[][]
  blanks: [number, number][]
}

export function generate9x9(blanksCount: number = 40): Puzzle9x9 {
  const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(0))
  solve(grid)

  const clues = grid.map(row => [...row])
  const allCells: [number, number][] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      allCells.push([r, c])
    }
  }

  const shuffled = shuffle(allCells)
  const blanks: [number, number][] = []
  const target = Math.min(blanksCount, 64)

  for (const [r, c] of shuffled) {
    if (blanks.length >= target) break
    const saved = clues[r][c]
    clues[r][c] = 0

    const testGrid = clues.map(row => [...row])
    if (countSolutions(testGrid) === 1) {
      blanks.push([r, c])
    } else {
      clues[r][c] = saved
    }
  }

  return { solution: grid, clues, blanks }
}

// Find cells that have only one possible value (naked singles) - for hints
export function findHintCell(
  clues: number[][],
  userValues: Record<string, number | null>,
): { row: number; col: number; value: number } | null {
  const cellVal = (r: number, c: number): number | null => {
    if (clues[r][c] !== 0) return clues[r][c]
    return userValues[`${r},${c}`] ?? null
  }

  // Collect all blank unfilled cells and their candidates
  const candidates: { row: number; col: number; possible: number[] }[] = []

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (cellVal(r, c) !== null) continue

      const used = new Set<number>()
      // Row
      for (let cc = 0; cc < 9; cc++) {
        const v = cellVal(r, cc)
        if (v) used.add(v)
      }
      // Col
      for (let rr = 0; rr < 9; rr++) {
        const v = cellVal(rr, c)
        if (v) used.add(v)
      }
      // Box
      const br = Math.floor(r / 3) * 3
      const bc = Math.floor(c / 3) * 3
      for (let rr = br; rr < br + 3; rr++) {
        for (let cc = bc; cc < bc + 3; cc++) {
          const v = cellVal(rr, cc)
          if (v) used.add(v)
        }
      }

      const possible = []
      for (let n = 1; n <= 9; n++) {
        if (!used.has(n)) possible.push(n)
      }

      if (possible.length > 0) {
        candidates.push({ row: r, col: c, possible })
      }
    }
  }

  // Return the cell with fewest candidates (easiest to deduce)
  candidates.sort((a, b) => a.possible.length - b.possible.length)
  if (candidates.length > 0) {
    const best = candidates[0]
    return { row: best.row, col: best.col, value: best.possible[0] }
  }
  return null
}
