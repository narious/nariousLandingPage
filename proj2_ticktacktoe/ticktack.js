
/*MODEL SECTION*/
var gameboard = (() => {
    board =  [[0,0,0],[0,0,0],[0,0,0]]
    function isValidPos(x, y) {
        return (board[x][y] == 0) 
    }
    return { board, isValidPos }
})()

var beginGame = (player1, player2) => {
    /*Explanation of the displayscreen 
        Magic numbers!!
        0 = the main screen
        1 = the game screen
        2 = the afterwin screen */ 
    displayscreen = 0
    players = [player1, player2]
    playerturn = 1

    function nextTurn() {
        this.playerturn = this.playerturn == 1 ? 2 : 1;
    }
    function updateBoard(x, y) {
        if (gameboard.isValidPos(x, y)) {
            gameboard.board[x][y] = this.playerturn
            const didwin = checkWin(gameboard, this.playerturn)
            if (didwin) {
                this.displayscreen = 2
                console.log("we have a winner")
            } else {
                gamestate.nextTurn()
            }
            updateScreen()
        }
        else {
            console.log("Position taken")
        }
    }
    return {playerturn, displayscreen, updateBoard, nextTurn, players}
}

const player = (name, playerNumber) => {
    return {name, playerNumber}
}

const player1 = player("Elf", 1)
const player2= player("Alice", 2)

var gamestate = beginGame(player1, player2)

/*CONTROLLER SECTION*/

function checkWin(gameboard, playerNumber) {
    var board = gameboard.board
    var row = [0,0,0]
    var col = [0,0,0]
    var diag = [0,0]
    const goal = 3

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] != playerNumber) {
                continue
            }
            var v = 1
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
    gamestate.updateBoard(x-1, y-1)
    console.log(gameboard.board)
  }

var gridbutton = document.getElementsByClassName("tiktacsquare");


for (var i = 0; i < gridbutton.length; i++) {
gridbutton[i].addEventListener("click", function() {
    updateCoordinate(this);
});
console.log(gridbutton[i]);
}

/*VIEW  SECTION*/

function disable(selector) {
    $(selector).attr("pointer-events", "none");
}

function toggleDisplay(selector, bool) {
    /**
     * Toggles a display on or off depending on the bool value
     * true for toggle on
     * falase for toggle off
     */
    if (bool) {
        if ($(selector).css("display") === "none") {
            $(selector).css("display", "block");
        }
    } else {
        if ($(selector).css("display") != "none") {
            $(selector).css("display", "none");
        }
    }
}


function mainScreenWillAppear() {

}

function gameScreenWillAppear() {

}

function showWinner() {
    $("#winnertext").html(`${gamestate.players[gamestate.playerturn-1].name} \n Wins!`)
    toggleDisplay("#winnertext", true)

}

function updateScreen() {

    // Updates the square
    for (let i = 0; i < gameboard.board.length; i++) {
        for (let j = 0; j < gameboard.board[0].length; j++) {
            const tiktacsquareid = `${i + 1},${j + 1}`
            const tiktacsquare = document.getElementById(tiktacsquareid).childNodes[1]
            const markclass = gameboard.board[i][j] == 0 ? null :  gameboard.board[i][j] == 1 ? "p1mark" : "p2mark";
            if (markclass != null) {
                if (!tiktacsquare.classList.contains(markclass)) {
                    tiktacsquare.classList.add(markclass)
                }
            }
        }
    }
    // Chckes winner
    if (gamestate.displayscreen == 2) {
        disable("#board")
        showWinner()
        return
    }

    $("#turntext").html(`PLAYER ${gamestate.playerturn} TURN`);
}


console.log("okay")



