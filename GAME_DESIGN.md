# Sudoku Zen Dojo - Game Design Document

## The Vibe
- **Aesthetic:** "Lo-fi Study Girl" meets "Duolingo". Soft pastels, rounded corners, generous whitespace.
- **Character:** "Numble" (a geometric spirit). Numble speaks in friendly bubbles. No scolding.
- **Feedback:** No red X marks. Use gentle shakes or soft color shifts for mistakes. Confetti for wins.

## Color Palette
- Background: Cream (#FFF8F0)
- Accents: Blush (#FFE4E1), Lavender (#E6E0F3), Mint (#D4EDDA), Sky (#D6EAF8), Peach (#FFDAB9)
- Highlight: Rose (#F8C8D4), Sage (#C7DFC5)
- Text: Soft Charcoal (#3D3D3D), Warm Gray (#9B8F8F)
- Deep: Plum (#4A3B5C)

## Sound Design
- All sounds generated via Web Audio API (AudioContext)
- Soft sine/triangle wave tones for interactions
- Gentle chime sequences for completion
- No harsh or alarming sounds

## The Curriculum

### Round 1: The Canvas
- **Concept:** Learn the 9x9 grid
- **Task:** Click cells to highlight them. Explore the grid freely.
- **Teaching:** Numble introduces the grid structure - 9 rows, 9 columns, 9 boxes
- **Unlock Message:** "You feel the rhythm."
- **Completion:** Click at least 15 different cells to explore the grid

### Round 2: Row Flow
- **Concept:** Learn no duplicates in rows
- **Task:** Complete single rows with missing numbers
- **Teaching:** Numble explains that each row must contain 1-9 with no repeats
- **Unlock Message:** "Numbers like their own space."
- **Completion:** Fill 3 rows correctly

### Round 3: Box Harmony
- **Concept:** Learn 3x3 sub-grids
- **Task:** Fill missing numbers in isolated 3x3 boxes
- **Teaching:** Numble explains that each 3x3 box must also contain 1-9
- **Unlock Message:** "Secret clubs."
- **Completion:** Complete 3 boxes correctly

### Round 4: Mini Puzzle
- **Concept:** Combine all rules
- **Task:** Solve a 6x6 Sudoku or a high-clue 9x9
- **Teaching:** Notes feature introduced
- **Unlock Message:** "Rules dance together."
- **Completion:** Solve the mini puzzle

### Round 5: Zen Master
- **Concept:** Full Sudoku experience
- **Task:** Solve a full 9x9 Sudoku puzzle
- **Teaching:** Hints system enabled
- **Unlock Message:** "You are the Zen Master."
- **Completion:** Complete the full puzzle

## Numble's Personality
- Friendly, encouraging, never scolding
- Uses gentle metaphors about rhythm, flow, harmony
- Celebrates small wins
- Offers hints as "whispers" not corrections
- Speech appears in rounded bubble dialogs with a soft bounce animation

## UI Layout
- **Sidebar (left):** Round selector, progress indicators
- **Main Stage (center):** The puzzle grid and interaction area
- **Numble Dialog (bottom/overlay):** Numble's speech bubbles and guidance
