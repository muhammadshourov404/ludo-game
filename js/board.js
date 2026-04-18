const board = document.getElementById('ludo-board');
export function createBoard() {
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell'); cell.dataset.row = row; cell.dataset.col = col;
            
            if (row < 6 && col < 6) cell.classList.add('bg-red');
            else if (row < 6 && col > 8) cell.classList.add('bg-green');
            else if (row > 8 && col < 6) cell.classList.add('bg-blue');
            else if (row > 8 && col > 8) cell.classList.add('bg-yellow');
            else if (row >= 6 && row <= 8 && col >= 6 && col <= 8) cell.classList.add('bg-center');
            else if (row === 7 && col > 0 && col < 6) cell.classList.add('bg-red');
            else if (col === 7 && row > 0 && row < 6) cell.classList.add('bg-green');
            else if (row === 7 && col > 8 && col < 14) cell.classList.add('bg-yellow');
            else if (col === 7 && row > 8 && row < 14) cell.classList.add('bg-blue');

            const safeZones = [{r: 6, c: 1}, {r: 2, c: 6}, {r: 1, c: 8}, {r: 6, c: 12}, {r: 8, c: 13}, {r: 12, c: 8}, {r: 13, c: 6}, {r: 8, c: 2}];
            if(safeZones.some(z => z.r === row && z.c === col)) {
                cell.innerHTML = `<svg viewBox="0 0 24 24" width="80%" height="80%" fill="#94a3b8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
            }
            board.appendChild(cell);
        }
    }
}
document.addEventListener('DOMContentLoaded', createBoard);
