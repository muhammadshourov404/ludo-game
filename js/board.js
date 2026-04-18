// js/board.js
// V4MPIR3 Ludo - Dynamic Board Generator without Images

const board = document.getElementById('ludo-board');
const GRID_SIZE = 15;

function createBoard() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Define Bases (Homes)
            if (row < 6 && col < 6) cell.classList.add('bg-red');
            else if (row < 6 && col > 8) cell.classList.add('bg-green');
            else if (row > 8 && col < 6) cell.classList.add('bg-blue');
            else if (row > 8 && col > 8) cell.classList.add('bg-yellow');
            
            // Define Center Triangle Area
            else if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
                cell.classList.add('bg-center');
                // Will add pure SVG inner triangles later via code
            }
            
            // Define Colored Paths (Home Straight)
            else if (row === 7 && col > 0 && col < 6) cell.classList.add('bg-red');
            else if (col === 7 && row > 0 && row < 6) cell.classList.add('bg-green');
            else if (row === 7 && col > 8 && col < 14) cell.classList.add('bg-yellow');
            else if (col === 7 && row > 8 && row < 14) cell.classList.add('bg-blue');

            // Draw SVG Stars for Safe Zones (Pure JS logic, NO external image)
            const safeZones = [
                {r: 6, c: 1}, {r: 2, c: 6}, {r: 1, c: 8}, {r: 6, c: 12},
                {r: 8, c: 13}, {r: 12, c: 8}, {r: 13, c: 6}, {r: 8, c: 2}
            ];
            
            const isSafe = safeZones.some(zone => zone.r === row && zone.c === col);
            if(isSafe) {
                // Inline SVG Star generated via JS
                cell.innerHTML = `<svg viewBox="0 0 24 24" width="80%" height="80%" fill="#94a3b8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            }

            board.appendChild(cell);
        }
    }
}

// Initialize board exactly when the script loads
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    console.log("Ludo Board Generated Successfully! - By V4MPIR3");
});
