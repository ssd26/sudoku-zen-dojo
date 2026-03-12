// 6x6 Sudoku: numbers 1-6, rows of 6, columns of 6, 3x2 boxes (3 rows x 2 cols)

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
  // Check row
  for (let c = 0; c < 6; c++) {
    if (grid[row][c] === num) return false
  }
  // Check column
  for (let r = 0; r < 6; r++) {
    if (grid[r][col] === num) return false
  }
  // Check 3x2 box (3 rows x 2 cols)
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 2) * 2
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 2; c++) {
      if (grid[r][c] === num) return false
    }
  }
  return true
}

function solve(grid: Grid): boolean {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6])
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

export interface Puzzle6x6 {
  solution: number[][] // 6x6 full solution
  clues: number[][]    // 6x6 with 0 for blanks
  blanks: [number, number][] // list of [row, col] pairs
}

// Count the number of valid solutions (stop at 2 to check uniqueness)
function countSolutions(grid: Grid, limit: number = 2): number {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r][c] === 0) {
        let count = 0
        for (let num = 1; num <= 6; num++) {
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
  return 1 // filled grid = 1 solution
}

export function generate6x6(blanksCount: number = 14): Puzzle6x6 {
  // Generate a full valid grid
  const grid: Grid = Array.from({ length: 6 }, () => Array(6).fill(0))
  solve(grid)

  // Remove cells one at a time, ensuring unique solution
  const clues = grid.map(row => [...row])
  const allCells: [number, number][] = []
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      allCells.push([r, c])
    }
  }

  const shuffled = shuffle(allCells)
  const blanks: [number, number][] = []
  const target = Math.min(blanksCount, 24)

  for (const [r, c] of shuffled) {
    if (blanks.length >= target) break
    const saved = clues[r][c]
    clues[r][c] = 0

    // Check that the puzzle still has exactly one solution
    const testGrid = clues.map(row => [...row])
    if (countSolutions(testGrid) === 1) {
      blanks.push([r, c])
    } else {
      clues[r][c] = saved // restore - removing this cell makes it ambiguous
    }
  }

  return { solution: grid, clues, blanks }
}
