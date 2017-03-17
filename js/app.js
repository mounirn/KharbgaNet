/* include after all dependecies */


var init = function () {
    var board,
        boardEl = $('#board');

        //  game = new Chess();   // KharbgaGame()

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
    };

    var onMoveEnd = function() {
      boardEl.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight);
    };

    var cfg = {
        draggable: true,
        position: 'start',
        onDragMove: onDragMove,
        onMoveEnd: onMoveEnd,
        sparePieces: true,
        showErrors : 'console'
    };
    var board = KharbgaBoard('board', cfg);
    //--- end example JS ---

}; // end init()
$(document).ready(init);