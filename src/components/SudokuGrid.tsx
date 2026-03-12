import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

interface SudokuGridProps {
  highlightedCells: Set<number>
  selectedCell: number | null
  onCellClick: (index: number) => void
}

export function SudokuGrid({ highlightedCells, selectedCell, onCellClick }: SudokuGridProps) {
  return (
    <div className="inline-grid grid-cols-9 gap-0 rounded-2xl overflow-hidden shadow-lg border-2 border-lavender/40 bg-white">
      {Array.from({ length: 81 }, (_, i) => {
        const row = Math.floor(i / 9)
        const col = i % 9
        const isHighlighted = highlightedCells.has(i)
        const isSelected = selectedCell === i

        // Determine box borders
        const borderRight = col === 2 || col === 5
        const borderBottom = row === 2 || row === 5

        return (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCellClick(i)}
            className={cn(
              'w-12 h-12 flex items-center justify-center text-sm font-semibold transition-colors relative',
              // Default state
              'bg-white hover:bg-sky/30',
              // Highlighted state
              isHighlighted && !isSelected && 'bg-lavender/30',
              // Selected state
              isSelected && 'bg-lavender/60',
              // Borders between cells
              'border-r border-b border-lavender/20',
              // Thicker box borders
              borderRight && 'border-r-2 border-r-lavender/50',
              borderBottom && 'border-b-2 border-b-lavender/50',
              // Remove outer borders (handled by parent)
              col === 8 && 'border-r-0',
              row === 8 && 'border-b-0',
            )}
          >
            {isHighlighted && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-1 rounded-lg bg-gradient-to-br from-lavender/40 to-sky/30"
              />
            )}
            {/* Cell number label for reference - subtle */}
            <span className={cn(
              'relative z-10 text-xs',
              isHighlighted ? 'text-deep-plum/60' : 'text-warm-gray/30',
            )}>
              {row + 1},{col + 1}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
