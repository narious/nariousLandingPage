
const gameboard = (() => {
    board =  [[0,0,0],[0,0,0],[0,0,0]]
    return { board }
})()

const player = (name, playerNumber) => {
    return {name, playerNumber}
}

const player1 = player("Elf", 1)
const player2= player("Alice", -1)

const gameState = {
    turn: 0
}


function checkWin(gameboard, playerNumber) {
    board = gameboard.board
    var row = [0,0,0]
    var col = [0,0,0]
    var diag = [0,0]
    const goal = 3 * playerNumber

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            v = board[i][j]
            col[j] += v
            row[i] += v

            if (i == 1 && j == 1) {
                diag[0] += v
                diag[1] += v

            } else {
                if ((i==0 && j == 0) || (i==2 && j==2)) {
                    diag[0] += v
                }
                if ((i==0 && j ==2) || (i==2 && j == 0)) {
                    diag[1] += v
                }
            }

            if (col[j] == goal || row[i] == goal || diag[0] == goal || diag[1] == goal){
                return true
            }
        }
    }
    return false
}


const playSound = (playerNumber) => {
    const audio = playerNumber == 1 ? document.getElementById("player1Sound") : document.getElementById("player2Sound");
    audio.play()
}

function clickedBox() {
    console.log("clicked")
}

// Get the element and iterate
function updateCoordinate(element) {
    var parentdiv = element.parentNode;
    const coordinate = parentdiv.getAttribute("id").split(",")
    const x = parseInt(coordinate[0])
    const y = parseInt(coordinate[1])
    console.log(x, y)
  }


var gridbutton = document.getElementsByClassName("tiktacsquare");


for (var i = 0; i < gridbutton.length; i++) {
gridbutton[i].addEventListener("click", function() {
    updateCoordinate(this);
});
console.log(gridbutton[i]);
}

playSound(1)
playSound(2)


