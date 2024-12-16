import React, { useState, useEffect } from "react";
import instructionsImage from './instructions.png';

const GRID_SIZE = 6;

type Cell = {
  value: number;
  isSelected: boolean;
  isHighlighted: boolean;
};

const generateGrid = (numberRange: number): Cell[][] => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => {
      let value;
      do {
        value = Math.ceil(Math.random() * numberRange);
      } while (value === 0);

      return {
        value,
        isSelected: false,
        isHighlighted: false,
      };
    })
  );
};

const App: React.FC = () => {
  const [level, setLevel] = useState<number>(1);
  const [grid, setGrid] = useState<Cell[][]>(generateGrid(level));
  const [start, setStart] = useState<[number, number] | null>(null);
  const [, setEnd] = useState<[number, number] | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [timer, setTimer] = useState<number>(300);
  const [isButtonEnabled, setIsButtonEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setIsButtonEnabled(true);
    }
  }, [timer]);

  const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLevel(parseInt(event.target.value, 10));
  };

  const handleCellClick = (row: number, col: number) => {
    if (start && start[0] === row && start[1] === col) {
      setStart(null);
      setGrid((prevGrid) =>
        prevGrid.map((r) =>
          r.map((cell) => ({
            ...cell,
            isSelected: false,
          }))
        )
      );
    } else if (!start) {
      setStart([row, col]);
      setGrid((prevGrid) =>
        prevGrid.map((r, rIdx) =>
          r.map((cell, cIdx) => ({
            ...cell,
            isSelected: rIdx === row && cIdx === col,
          }))
        )
      );
    } else {
      setEnd([row, col]);
      highlightSelection(start, [row, col]);
    }
  };  

  const highlightSelection = (start: [number, number], end: [number, number]) => {
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;
  
    if (startRow !== endRow && startCol !== endCol && Math.abs(startRow - endRow) !== Math.abs(startCol - endCol)) {
      console.log("Selection must be in a row, column, or diagonal.");
      return;
    }
  
    const newGrid = [...grid];
    let sequence: number[] = [];
    let highlightCells: [number, number][] = [];
  
    if (startRow === endRow) {
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
        sequence.push(newGrid[startRow][col].value);
        highlightCells.push([startRow, col]);
      }
    } else if (startCol === endCol) {
      for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
        sequence.push(newGrid[row][startCol].value);
        highlightCells.push([row, startCol]);
      }
    } else {
      const rowStep = startRow < endRow ? 1 : -1;
      const colStep = startCol < endCol ? 1 : -1;
      let row = startRow;
      let col = startCol;
  
      while (row !== endRow + rowStep && col !== endCol + colStep) {
        sequence.push(newGrid[row][col].value);
        highlightCells.push([row, col]);
        row += rowStep;
        col += colStep;
      }
    }
  
    if (sequence.length < 3) {
      console.log("The sequence must be at least 3 numbers long.");
      return;
    }
  
    const isCorrect = evaluateSequence(sequence);
  
    if (isCorrect) {
      highlightCells.forEach(([row, col]) => {
        newGrid[row][col].isHighlighted = true;
      });
    }
  
    setGrid(newGrid);
    setStart(null);
    setEnd(null);
  };
  

  const evaluateSequence = (sequence: number[]) => {
    const sumOfRestExceptLast = sequence.slice(0, -1).reduce((acc, num) => acc + num, 0);
    const last = sequence[sequence.length - 1];
  
    const sumOfRestExceptFirst = sequence.slice(1).reduce((acc, num) => acc + num, 0);
    const first = sequence[0];
  
    if (sumOfRestExceptLast === last || sumOfRestExceptFirst === first) {
      const pointsScored = sumOfRestExceptLast === last ? sumOfRestExceptLast : sumOfRestExceptFirst;
      setScore((prevScore) => prevScore + pointsScored);
      console.log(`Correct! You scored ${pointsScored} points.`);
      return true;
    } else {
      console.log("Incorrect selection. Try again.");
      return false;
    }
  };  

  const resetGrid = () => {
    setGrid(generateGrid(level));
    setStart(null);
    setEnd(null);
    setScore(0);
    setIsButtonEnabled(false);
    setTimer(300);
  };

  const showSolutions = () => {
    const newGrid = [...grid];
    let totalScore = 0;
  
    const evaluateAndHighlight = (sequence: number[], highlightCells: [number, number][]) => {
      const sumOfRestExceptLast = sequence.slice(0, -1).reduce((acc, num) => acc + num, 0);
      const last = sequence[sequence.length - 1];
    
      const sumOfRestExceptFirst = sequence.slice(1).reduce((acc, num) => acc + num, 0);
      const first = sequence[0];
    
      let pointsScored = 0;
    
      if (sequence.length >= 3 && (sumOfRestExceptLast === last || sumOfRestExceptFirst === first)) {
        pointsScored = sumOfRestExceptLast === last ? sumOfRestExceptLast : sumOfRestExceptFirst;
        highlightCells.forEach(([row, col]) => {
          newGrid[row][col].isHighlighted = true; // Mark as part of the solution
        });
      }
      return pointsScored;
    };
    
  
    // Check all horizontal sequences
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let colStart = 0; colStart < GRID_SIZE - 1; colStart++) {
        for (let colEnd = colStart + 1; colEnd < GRID_SIZE; colEnd++) {
          const sequence = [];
          const highlightCells: [number, number][] = [];
          for (let col = colStart; col <= colEnd; col++) {
            sequence.push(newGrid[row][col].value);
            highlightCells.push([row, col]);
          }

          if (sequence.length > 2) {  // Ensure at least 3 elements
            const pointsScored = evaluateAndHighlight(sequence, highlightCells);
            totalScore += pointsScored;
          }
        }
      }
    }
  
    // Check all vertical sequences
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let rowStart = 0; rowStart < GRID_SIZE - 1; rowStart++) {
        for (let rowEnd = rowStart + 1; rowEnd < GRID_SIZE; rowEnd++) {
          const sequence = [];
          const highlightCells: [number, number][] = [];
          for (let row = rowStart; row <= rowEnd; row++) {
            sequence.push(newGrid[row][col].value);
            highlightCells.push([row, col]);
          }

          if (sequence.length > 2) {  // Ensure at least 3 elements
            const pointsScored = evaluateAndHighlight(sequence, highlightCells);
            totalScore += pointsScored;
          }
        }
      }
    }
  
    // Check all diagonal sequences (top-left to bottom-right)
    for (let rowStart = 0; rowStart < GRID_SIZE - 1; rowStart++) {
      for (let colStart = 0; colStart < GRID_SIZE - 1; colStart++) {
        let row = rowStart;
        let col = colStart;
        const sequence = [];
        const highlightCells: [number, number][] = [];
        while (row < GRID_SIZE && col < GRID_SIZE) {
          sequence.push(newGrid[row][col].value);
          highlightCells.push([row, col]);
          row++;
          col++;
        }
        if (sequence.length > 2) {  // Ensure at least 3 elements
          const pointsScored = evaluateAndHighlight(sequence, highlightCells);
          totalScore += pointsScored;
        }
      }
    }
  
    // Check all diagonal sequences (top-right to bottom-left)
    for (let rowStart = 0; rowStart < GRID_SIZE - 1; rowStart++) {
      for (let colStart = GRID_SIZE - 1; colStart > 0; colStart--) {
        let row = rowStart;
        let col = colStart;
        const sequence = [];
        const highlightCells: [number, number][] = [];
        while (row < GRID_SIZE && col >= 0) {
          sequence.push(newGrid[row][col].value);
          highlightCells.push([row, col]);
          row++;
          col--;
        }
        if (sequence.length > 2) {  // Ensure at least 3 elements
          const pointsScored = evaluateAndHighlight(sequence, highlightCells);
          totalScore += pointsScored;
        }
      }
    }
  
    // Update grid and score after evaluating all solutions
    setGrid(newGrid);
    setScore(totalScore);
    console.log(`Displaying solutions. Total score: ${totalScore}`);
  };
   
  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>La Grille</h1>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <label style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
        <h2>Points: {score} | Niveau
          <select
            value={level}
            onChange={handleLevelChange}
            style={{
              marginLeft: "10px",
              marginBottom: "10px",
              padding: "5px 10px",
              fontSize: "14px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
              color: "#333",
              outline: "none",
              cursor: "pointer",
              gap: "5px",
              justifyContent: "center",
            }}
          >
            <option value={3}>1</option>
            <option value={6}>2</option>
            <option value={12}>3</option>
            <option value={24}>4</option>
            <option value={48}>5</option>
          </select></h2>
        </label>
      </div>
      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 50px)`,
          gap: "5px",
          justifyContent: "center",
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: cell.isHighlighted
                  ? "lightgreen"
                  : cell.isSelected
                  ? "lightblue"
                  : "white",
                border: "1px solid black",
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              {cell.value}
            </div>
          ))
        )}
      </div>
      {/* Add margin between grid and buttons */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={resetGrid}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "150px",
          }}
        >
          Nouveau jeu
        </button>
        <button
          onClick={showSolutions}
          disabled={!isButtonEnabled}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "150px",
          }}
        >
          {isButtonEnabled ? "Solutions" : `${timer}s`}
        </button>
      </div>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button 
          onClick={togglePopup}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
            cursor: "pointer",
            width: "310px",
          }}>
            Instructions
        </button>
        </div>
      {isPopupOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <h2>Instructions</h2>
          <img 
            src={instructionsImage}
            alt="Instructions Visual" 
            style={{
              maxWidth: "100%",
              maxHeight: "80%",
              borderRadius: "10px",
            }}
          />
          <button 
            onClick={togglePopup} 
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              background: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
