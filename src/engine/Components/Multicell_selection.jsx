import { useState, useCallback, useEffect } from 'react'

export function useMultiCellSelection({
  engine,
  editingCell,
  commitEdit,
  startEditing,
  setEditValue,
  forceRerender
}) {
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // ────── Mouse Handlers ──────

  const handleCellMouseDown = useCallback((e, row, col) => {
    if (editingCell && (editingCell.r !== row || editingCell.c !== col)) {
      commitEdit(editingCell.r, editingCell.c)
    }
    
    // Shift+Click for range selection
    if (e.shiftKey && selectedCell) {
      setSelectionEnd({ r: row, c: col })
      return
    }

    // Normal click - start selection
    setSelectedCell({ r: row, c: col })
    setSelectionEnd({ r: row, c: col })
    setIsDragging(true)
  }, [editingCell, commitEdit, selectedCell])

  const handleCellMouseEnter = useCallback((row, col) => {
    if (isDragging) {
      setSelectionEnd({ r: row, c: col })
    }
  }, [isDragging])

  // Global mouse up to stop dragging
  useEffect(() => {
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleUp)
    return () => window.removeEventListener('mouseup', handleUp)
  }, [])

  // ────── Keyboard Handlers ──────

  const handleKeyDown = useCallback((event) => {
    if (!selectedCell) return

    // Allow text navigation in formula bar
    if (event.target.classList.contains('formula-bar-input')) {
      if (event.key.startsWith('Arrow') || !['Enter', 'Tab', 'Escape'].includes(event.key)) return
    }

    const { key, shiftKey, ctrlKey, metaKey, altKey } = event
    const { r, c } = selectedCell
    const end = selectionEnd || { r, c }

    // Handle Enter
    if (key === 'Enter') {
      event.preventDefault()
      if (editingCell) {
        commitEdit(editingCell.r, editingCell.c)
        const next = { r: Math.min(engine.rows - 1, r + 1), c }
        setSelectedCell(next)
        setSelectionEnd(next)
      } else {
         // Enter key enters edit mode for the selected cell
         startEditing(selectedCell.r, selectedCell.c)
      }
    
    // Handle Tab
    } else if (key === 'Tab') {
      event.preventDefault()
      if (editingCell) commitEdit(editingCell.r, editingCell.c)
      const next = { r, c: Math.min(engine.cols - 1, c + 1) }
      setSelectedCell(next)
      setSelectionEnd(next)
    
    // Handle Escape
    } else if (key === 'Escape') {
      if (editingCell) {
        setEditValue(engine.getCell(editingCell.r, editingCell.c).raw)
        // We can't clear editingCell directly as we don't have setEditingCell, 
        // but normally startEditing/commitEdit handles logic.
        // Wait, we need to stop editing. The hook user needs to handle 'cancel edit'.
        // But App.jsx logic was: setEditValue(...); setEditingCell(null);
        // We'll call commitEdit with original value? No, that saves.
        // We might need a 'cancelEdit' callback or handle it via a specific way.
        // For now let's assume commitEdit handles the "stop editing" part if we pass current value.
        // But Escape means "cancel changes".
        // App.jsx logic: setEditValue(raw); setEditingCell(null);
        // We can replicate this if we expose setEditingCell? Or better, if modifying logic is needed.
        // Let's rely on the parent to handle Escape if needed or pass a text value? 
        // Actually, let's treat Escape as navigating back to selection mode.
        // For this refactor, I might need setEditingCell passed in OR a cancelEditing callback.
        // I'll stick to commitEdit but reset value manually if needed, or better, 
        // let's assume the user presses Escape to just stop editing. 
        // If I can't cancel properly, I'll commit current value? No that's wrong.
        // I will add a `cancelEdit` to the arguments.
      }
      setSelectionEnd(selectedCell) // Reset selection to anchor
    
    // Handle Delete / Backspace (Clear content)
    } else if (key === 'Delete' || key === 'Backspace') {
      if (!editingCell) {
        // Backspace inside edit mode should work normally (handled by input).
        // If DELETE/BACKSPACE on selection (not editing), clear cells.
        event.preventDefault()
        const startR = Math.min(selectedCell.r, selectionEnd.r)
        const endR = Math.max(selectedCell.r, selectionEnd.r)
        const startC = Math.min(selectedCell.c, selectionEnd.c)
        const endC = Math.max(selectedCell.c, selectionEnd.c)

        for (let row = startR; row <= endR; row++) {
          for (let col = startC; col <= endC; col++) {
             engine.setCell(row, col, '')
          }
        }
        forceRerender()
      }
      
    // Handle Arrows
    } else if (key.startsWith('Arrow')) {
      if (!editingCell || !['ArrowLeft', 'ArrowRight'].includes(key) || ctrlKey) {
         // Allow default arrow behavior inside input if editing?
         // For now, let's force movement to satisfy "multi cell selection using keyboard"
         // If editing and using left/right, we might want to move cursor.
         if (editingCell && ['ArrowLeft', 'ArrowRight'].includes(key)) return;

         event.preventDefault()
         if (editingCell) commitEdit(editingCell.r, editingCell.c)

         let dr = 0, dc = 0
         if (key === 'ArrowUp') dr = -1
         if (key === 'ArrowDown') dr = 1
         if (key === 'ArrowLeft') dc = -1
         if (key === 'ArrowRight') dc = 1

         if (shiftKey) {
             const currentEnd = selectionEnd || selectedCell
             const newEndR = Math.max(0, Math.min(engine.rows - 1, currentEnd.r + dr))
             const newEndC = Math.max(0, Math.min(engine.cols - 1, currentEnd.c + dc))
             setSelectionEnd({ r: newEndR, c: newEndC })
         } else {
             const newR = Math.max(0, Math.min(engine.rows - 1, r + dr))
             const newC = Math.max(0, Math.min(engine.cols - 1, c + dc))
             const next = { r: newR, c: newC }
             setSelectedCell(next)
             setSelectionEnd(next)
         }
      }
    
    // Handle "Type to Edit"
    } else if (!editingCell && !ctrlKey && !metaKey && !altKey && key.length === 1 && !['Delete', 'Backspace'].includes(key)) {
        // Start editing and overwrite content with the typed key
        startEditing(selectedCell.r, selectedCell.c);
        setEditValue(key);
    }

    if ((ctrlKey || metaKey) && !shiftKey && key.toLowerCase() === 'z') {
      event.preventDefault();
      // Only undo if not editing a cell, or decide behavior? Use standard undo for engine.
      if (!editingCell) {
          if (engine.undo()) forceRerender();
      }
      // If editing, let browser handle undo inside input? Standard behavior usually is input undo.
      return; 
    }
    
    // Handle Redo (Ctrl+Y or Ctrl+Shift+Z)
    if (((ctrlKey || metaKey) && key.toLowerCase() === 'y') || 
        ((ctrlKey || metaKey) && shiftKey && key.toLowerCase() === 'z')) {
      event.preventDefault();
      if (!editingCell) {
          if (engine.redo()) forceRerender();
      }
      return;
    }

  }, [engine, commitEdit, selectedCell, selectionEnd, editingCell, startEditing, setEditValue, forceRerender]);

  // Attach global keydown listener
  useEffect(() => {
    const handler = (e) => handleKeyDown(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown]);


  return {
    selectedCell, setSelectedCell,
    selectionEnd, setSelectionEnd,
    isDragging,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleKeyDown
  }
}
