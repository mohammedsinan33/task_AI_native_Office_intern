import { useState, useCallback, useMemo } from 'react';

export function useColumnFilter({ engine, forceRerender }) {
  const [filters, setFilters] = useState({}); // { colIndex: 'filterString' }
  const [showFilterInputs, setShowFilterInputs] = useState(false);

  const toggleFilterInputs = useCallback(() => {
    setShowFilterInputs(prev => !prev);
  }, []);

  const setFilter = useCallback((colIndex, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete newFilters[colIndex];
      } else {
        newFilters[colIndex] = value;
      }
      return newFilters;
    });
    forceRerender();
  }, [forceRerender]);

  const filteredRows = useMemo(() => {
    const indices = [];
    const activeFilters = Object.entries(filters);

    if (activeFilters.length === 0) {
       // Return all rows if no active filters
       // We assume engine.rows handles the source of truth
       return Array.from({ length: engine.rows }, (_, i) => i);
    }

    for (let r = 0; r < engine.rows; r++) {
      let isVisible = true;
      for (const [colStr, filterVal] of activeFilters) {
        const col = parseInt(colStr, 10);
        const cell = engine.getCell(r, col);
        // Use computed value for filtering if available, else raw
        // Ensure we handle null/undefined safely
        let cellValue = cell.computed;
        if (cellValue === null || cellValue === undefined) {
            cellValue = cell.raw || '';
        }
        
        // Simple case-insensitive "contains" check
        if (!String(cellValue).toLowerCase().includes(filterVal.toLowerCase())) {
          isVisible = false;
          break;
        }
      }
      
      if (isVisible) {
        indices.push(r);
      }
    }
    return indices;
  }, [engine, filters, engine.rows]); // Note: engine.rows is a getter, might not trigger update automatically. We rely on forceRerender parent updates.

  return {
    filters,
    setFilter,
    filteredRows,
    showFilterInputs,
    toggleFilterInputs
  };
}
