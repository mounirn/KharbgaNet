/// reference kharbga.js
/* include after all dependecies */


var init = function () {
    var board,
        boardEl = $('#board');

    var game = new Kharbga.Game();   // KharbgaGame()

    var  squareClass = 'square-55d63',
        squareToHighlight,
        colorToHighlight;
    //--- start example JS ---
    var onDragMove = function (newLocation, oldLocation, source,
        piece, position, orientation) {
        console.log("New location: " + newLocation);
        console.log("Old location: " + oldLocation);
        console.log("Source: " + source);
        console.log("Piece: " + piece);
        console.log("Position: " + KharbgaBoard.objToFen(position));
        console.log("Orientation: " + orientation);
        console.log("--------------------");
     //   console.log("game state: " + game.state.toString());

        // add logic to check if current player is allowed to make this move
    };

    // do not pick up pieces if the game is over
    // only pick up pieces for the side to move
    var onDragStart = function(source, piece, position, orientation) {
   /*   if (game.game_over() === true ||
          (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
          (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
      }
    */

    };

    var onMoveEnd = function() {
      boardEl.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight);

     // add logic to check if a valid move

    };

    var cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDragMove: onDragMove,
        onMoveEnd: onMoveEnd,
        sparePieces: true,
        showErrors : 'console'
    };
    var board = KharbgaBoard('board', cfg);
    

    function clickGetPositionBtn() {
      console.log("Current position as an Object:");
      console.log(board.position());

     $('#fen').html(board.fen());
     $('#pgn').html(board.position().toString());

      console.log("Current position as a FEN string:");
      console.log(board.fen());
    }

    $('#getPositionBtn').on('click', clickGetPositionBtn);
    $('#startPositionBtn').on('click', board.start);
    $('#clearBoardBtn').on('click', board.clear);
    $('#clearBoardInstantBtn').on('click', function() {
        board.clear(false);
    });

    // flip the board
    $('#flipOrientationBtn').on('click', board.flip);

    // handler for resizing
    $(window).resize(board.resize);

}; // end init()
$(document).ready(init);