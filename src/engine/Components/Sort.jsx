import { useState, useCallback } from 'react';

export function useColumnSort({ engine, forceRerender }) {
  const [sortConfig, setSortConfig] = useState({ col: null, direction: null });
  // rowMapping maps Current Row Index -> Original Row Index (relative to start of sort)
  // rowMapping[i] = Original Index of the row currently at position i
  const [rowMapping, setRowMapping] = useState(null);

  const toggleSort = useCallback((colIndex) => {
    // 1. Determine Next State
    let nextDir = 'asc';
    let currentMapping = rowMapping;

    // Check if switching columns
    if (sortConfig.col !== colIndex) {
      // New column: Reset mapping to identity (commit current order)
      // Because "None" on new column means "Unsorted relative to when we started sorting THIS column"
      // or "Current order".
      nextDir = 'asc';
      currentMapping = Array.from({ length: engine.rows }, (_, i) => i);
    } else {
      // Same column: Cycle
      if (sortConfig.direction === 'asc') nextDir = 'desc';
      else if (sortConfig.direction === 'desc') nextDir = null;
    }

    // 2. Handle "None" (Restore)
    if (nextDir === null) {
      if (currentMapping) {
        // Restore order using currentMapping
        // We want Reorder Permutation R such that R[originalIndex] = currentIndex
        // rowMapping[k] tells us original index of row at k.
        // We need to find `k` such that rowMapping[k] == i to put originally-i-th row into position i.
        
        const restorePermutation = new Array(engine.rows);
        for (let i = 0; i < engine.rows; i++) {
            // Find where original row `i` is currently located
            const currentIndex = currentMapping.indexOf(i);
            if (currentIndex !== -1) {
                // To restore original row `i` to position `i`, we need to pick from `currentIndex`
                // reorderRows uses: newRow[i] = oldRow[P[i]]
                // So P[i] should be currentIndex.
                restorePermutation[i] = currentIndex;
            } else {
                restorePermutation[i] = i; 
            }
        }
        
        engine.reorderRows(restorePermutation);
      }
      
      setRowMapping(null);
      setSortConfig({ col: null, direction: null });
      forceRerender();
      return;
    }

    // 3. Prepare for Sort (Asc or Desc)
    // If starting fresh (currentMapping null or we just switched cols and made it identity above)
    // But `rowMapping` state var might be stale if we just switched cols?
    // We use `currentMapping` local var.
    if (!currentMapping) {
        currentMapping = Array.from({ length: engine.rows }, (_, i) => i);
    }

    // 4. Perform Sort
    // We sort the *current* rows physically.
    const rows = Array.from({ length: engine.rows }, (_, i) => i);
    const rowData = rows.map(rIndex => {
        const cell = engine.getCell(rIndex, colIndex);
        let val = cell.computed;
        if (val === null || val === undefined) val = cell.raw || '';
        
        let num = val;
        let isNum = false;
        
        if (typeof val === 'number') {
            isNum = true;
        } else if (typeof val === 'string' && val.trim() !== '') {
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && isFinite(parsed)) {
                num = parsed;
                isNum = true;
            }
        } else if (typeof val === 'object' && val !== null) {
            val = String(val);
        }

        // Lowercase strings for case-insensitive sort
        const compareVal = isNum ? num : (typeof val === 'string' ? val.toLowerCase() : val);

        return { rIndex, val: compareVal, isNum, originalVal: val };
    });

    const compare = (a, b) => {
        // Empty cells at bottom
        const emptyA = a.originalVal === '' || a.originalVal === null || a.originalVal === undefined;
        const emptyB = b.originalVal === '' || b.originalVal === null || b.originalVal === undefined;
        if (emptyA && emptyB) return 0;
        if (emptyA) return 1;
        if (emptyB) return -1;

        if (a.isNum && !b.isNum) return -1; // Numbers first
        if (!a.isNum && b.isNum) return 1;

        if (a.val < b.val) return -1;
        if (a.val > b.val) return 1;
        return 0;
    };

    rowData.sort(compare);

    if (nextDir === 'desc') {
        rowData.reverse();
    }

    // Extract permutation P where P[i] is the *old index* of the row that moves to *new index i*
    const p = rowData.map(d => d.rIndex);

    // Apply to engine
    engine.reorderRows(p);

    // Update Mapping
    // newRowMapping[i] = currentMapping[p[i]]
    // (The row at new position i came from old position p[i], which had original index currentMapping[p[i]])
    const nextMapping = p.map(oldIndex => currentMapping[oldIndex]);

    setRowMapping(nextMapping);
    setSortConfig({ col: colIndex, direction: nextDir });
    forceRerender();

  }, [engine, forceRerender, sortConfig, rowMapping]);

  return { sortConfig, toggleSort };
}

