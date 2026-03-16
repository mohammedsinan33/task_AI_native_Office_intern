import { useEffect, useCallback } from 'react';

export function useMultiCellCopyPaste({
  engine,
  selectedCell,
  selectionEnd,
  editingCell,
  forceRerender
}) {

  const getSelectedRange = useCallback(() => {
    if (!selectedCell) return null;
    const r1 = selectedCell.r;
    const c1 = selectedCell.c;
    const r2 = selectionEnd ? selectionEnd.r : r1;
    const c2 = selectionEnd ? selectionEnd.c : c1;

    return {
      startRow: Math.min(r1, r2),
      endRow: Math.max(r1, r2),
      startCol: Math.min(c1, c2),
      endCol: Math.max(c1, c2)
    };
  }, [selectedCell, selectionEnd]);

  // Common copy logic
  const copySelectionToClipboard = useCallback((e, range) => {
    if (!range) return;

    const { startRow, endRow, startCol, endCol } = range;
    const rows = [];
    
    for (let r = startRow; r <= endRow; r++) {
      const rowData = [];
      for (let c = startCol; c <= endCol; c++) {
        const cell = engine.getCell(r, c);
        // We copy the raw value (formula or text)
        // Ideally checking for null/undefined
        rowData.push(cell.raw === undefined || cell.raw === null ? '' : cell.raw);
      }
      rows.push(rowData.join('\t'));
    }

    const textToCopy = rows.join('\n');
    
    if (e && e.clipboardData) {
      e.clipboardData.setData('text/plain', textToCopy);
    } else {
      // Fallback for older browsers or if event doesn't support clipboardData
      navigator.clipboard.writeText(textToCopy).catch(err => console.error('Copy failed:', err));
    }
  }, [engine]);

  const handleCopy = useCallback((e) => {
    if (editingCell) return;
    if (!selectedCell) return;
    e.preventDefault();
    const range = getSelectedRange();
    copySelectionToClipboard(e, range);
  }, [editingCell, selectedCell, copySelectionToClipboard, getSelectedRange]);

  const handleCut = useCallback((e) => {
    if (editingCell) return;
    if (!selectedCell) return;
    e.preventDefault();
    
    // 1. Copy to clipboard
    const range = getSelectedRange();
    if (!range) return;
    copySelectionToClipboard(e, range);

    // 2. Clear the selected cells
    const { startRow, endRow, startCol, endCol } = range;

    const updates = [];
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = `${r},${c}`;
        updates.push({ r, c, value: '' });
      }
    }

    if (updates.length > 0) {
      // Use setCells for atomic undo
      if (engine.setCells) {
        engine.setCells(updates);
      } else {
        // Fallback if setCells not available
        updates.forEach(({ r, c, value }) => engine.setCell(r, c, value));
      }
      forceRerender();
    }
  }, [editingCell, selectedCell, copySelectionToClipboard, getSelectedRange, engine, forceRerender]);

  const handlePaste = useCallback((e) => {
    if (editingCell) return;
    if (!selectedCell) return;

    e.preventDefault();

    let text = '';
    if (e.clipboardData) {
      text = e.clipboardData.getData('text/plain');
    } else {
      // We can't synchronously read clipboard if not in event, but here we are in 'paste' event.
      // If e.clipboardData is missing, we might fail or try async read (which might not work in sync handler)
      return; 
    }

    if (!text) return;

    // Parse TSV/CSV logic
    // Handle standard spreadsheet copy format (TSV)
    // Split by newlines for rows
    const rows = text.split(/\r\n|\n|\r/);
    
    // Determine target start position
    const startRow = Math.min(selectedCell.r, selectionEnd?.r ?? selectedCell.r);
    const startCol = Math.min(selectedCell.c, selectionEnd?.c ?? selectedCell.c);

    const updates = [];

    rows.forEach((rowStr, rIndex) => {
      // Skip trailing empty line
      if (rIndex === rows.length - 1 && rowStr === '') return;

      const cols = rowStr.split('\t');
      cols.forEach((value, cIndex) => {
        const targetR = startRow + rIndex;
        const targetC = startCol + cIndex;

        // Ensure we don't go out of bounds
        if (targetR < engine.rows && targetC < engine.cols) {
            // Remove surrounding quotes if present (standard CSV/TSV behavior sometimes)
            let cleanValue = value;
            if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
                cleanValue = cleanValue.slice(1, -1).replace(/""/g, '"');
            }
            updates.push({ r: targetR, c: targetC, value: cleanValue });
        }
      });
    });

    if (updates.length > 0) {
      // Use setCells if available
      if (engine.setCells) {
        engine.setCells(updates);
      } else {
        updates.forEach(u => engine.setCell(u.r, u.c, u.value));
      }
      forceRerender();
    }
  }, [engine, selectedCell, selectionEnd, editingCell, forceRerender]);

  useEffect(() => {
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleCopy, handleCut, handlePaste]);
}
