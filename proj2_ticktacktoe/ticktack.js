
/*MODEL SECTION*/

class Constants {
    static get boardId() { return "#board"}
    static get mainscreenId() { return "#mainscreen"} 
}

var gameboard = (() => {
    board =  [[0,0,0],[0,0,0],[0,0,0]]
    function isValidPos(x, y) {
        return (board[x][y] == 0) 
    }
    return { board, isValidPos }
})()

var beginGameState = (player1, player2) => {
    /*Explanation of the displayscreen 
        Magic numbers!!
        0 = the main screen
        1 = the game screen
        2 = the afterwin screen */ 
    displayscreen = 0
    players = [player1, player2]
    playerturn = 1
    isAIMode = false

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
    return {playerturn, displayscreen, updateBoard, nextTurn, players, isAIMode}
}

const player = (name, playerNumber) => {
    return {name, playerNumber}
}

// const player1 = player("Elf", 1)
// const player2= player("Alice", 2)

// var gamestate = beginGameState(player1, player2)

/*CONTROLLER SECTION*/
// Creates a global variable later to be updated
var gamestate; 

function setUpGame(mode) {
    /**
     * Mode can be single or multiplayer
     * @param mode int (1 or 2)
     * 
     */
    if (mode == 2) {
        if (checkInputs(2)) {
            var p1name = $("#p1name").val();
            var p2name = $("#p2name").val();
        } else {
            var p1name = "Elf";
            var p2name = "Orc";
        }
        const player1 = player(p1name, 1)
        const player2= player(p2name, 2)
        var newgamestate = beginGameState(player1, player2)
      }
      // Single player mode 
      else {
          console.log("Single player not implemented yet..")
          return
      }
    console.log("setting up new game state...")
    console.log(newgamestate)
    gamestate = newgamestate;
    toggleDisplay("#mainscreen", false)
    togglePointerEvents("#board", true)
    updateScreen()
  }

function checkInputs(mode) {
    var p1name = $("#p1name").val();
    var p2name = $("#p2name").val();
    if (mode == 2) {
        return (p1name != "" && p2name != "")
    } else {
        return (p1name != "")
    }
  }


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

  function setUpgridButton(){
    var gridbutton = document.getElementsByClassName("tiktacsquare");
    for (var i = 0; i < gridbutton.length; i++) {
    gridbutton[i].addEventListener("click", function() {
        updateCoordinate(this);
    });
    }
  }


/**SECTION FOR AI MODE */
function aiMove(gameboard, gamestate) {
    x = 0;
    y = 0;
    // Write some logic here
    return x, y
}

/*VIEW  SECTION*/

function togglePointerEvents(selector, bool) {
    if (bool) {
        $(selector).attr("pointer-events", "auto");
        return
    }

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
        togglePointerEvents(Constants.boardId, false)
        showWinner()
        return
    }

    $("#turntext").html(`${gamestate.players[gamestate.playerturn-1].name} TURN`);
}


console.log("compiled")


/**
 * The running the code part in the background
 */
setUpgridButton()
togglePointerEvents(Constants.boardId, false)