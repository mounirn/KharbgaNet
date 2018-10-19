var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Represents the game board composed of a 7 by 7 cells
     * The board is set by two players (an Attacker and a Defender)
     * two pieces at a time starting by the attacker
     */
    var Board = (function () {
        function Board(events) {
            this.UseArabicIds = false;
            this.cellsById = new Object(); // the cells dictionary accessed by cell ID
            this.piecesSetCount = 0; // keeps track of the number of player pieces set on the board
            this.UseArabicIds = false; // default
            this.boardEvents = events;
            this.cells = []; // init array
            for (var r = 0; r < 7; r++) {
                this.cells[r] = [];
                for (var c = 0; c < 7; c++) {
                    var cell = new Kharbga.BoardCell(this, r, c);
                    this.cells[r][c] = cell;
                    this.cellsById[cell.id] = cell;
                }
            }
            this._cellIds = Object.keys(this.cellsById);
            // process the board to set adjacent cells
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var cell = this.cellsById[id];
                cell.setAdjacentCells(this);
            }
        }
        /**
         * Creates a new board based with the same state
         */
        Board.prototype.clone = function () {
            var ret = new Board(null);
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 7; c++) {
                    var cell = this.cells[r][c];
                    var clonedCell = ret.getCell(r, c);
                    clonedCell.setSameAs(cell);
                }
            }
            return ret;
        };
        /**
         * returns the current game fen which is a visual string representation of the board in the
         * format: /sSssSs1/2S2s1/7/7/7/ where digits represent the number of empty cells, S represents
         * an attacker solider, 's' represents a defender solider.
         *
         */
        Board.prototype.fen = function () {
            var ret = "";
            for (var r = 6; r >= 0; r--) {
                for (var c = 0; c < 7; c++) {
                    var cell = this.cells[r][c];
                    if (cell.isEmpty()) {
                        ret += "1";
                    }
                    else {
                        if (cell.isOccupiedByAttacker()) {
                            ret += "S";
                        }
                        else {
                            if (cell.isOccupiedByDefender()) {
                                ret += "s";
                            }
                        }
                    }
                }
                if (r !== 0) {
                    ret += "/";
                }
            }
            // squeeze the numbers together
            ret = ret.replace(/1111111/g, "7");
            ret = ret.replace(/111111/g, "6");
            ret = ret.replace(/11111/g, "5");
            ret = ret.replace(/1111/g, "4");
            ret = ret.replace(/111/g, "3");
            ret = ret.replace(/11/g, "2");
            return ret;
        };
        /**
         * @summary Returns the cell by row and column numbers
         */
        Board.prototype.getCell = function (row, col) {
            /// add checks for the row and col
            return this.cells[row][col];
        };
        /**
         * @summary Returns the cell by a cell Id
         */
        Board.prototype.getCellById = function (id) {
            return this.cellsById[id];
        };
        /**
         * @summary Checks if a given cell is occupied by the attacker
         * @param id the id of the cell to check
         * @returns true if a valid cell and occupied by the attacker, false otherwise
         */
        Board.prototype.isOccupiedByAttacker = function (id) {
            var cell = this.getCellById(id);
            if (cell == null) {
                return false;
            }
            return cell.isOccupiedByAttacker();
        };
        /**
         * @summary Checks if a given cell is occupied by the defender
         * @param id the id of the cell to check
         * @returns true if a valid cell and occupied by the defender, false otherwise
         */
        Board.prototype.isOccupiedByDefender = function (id) {
            var cell = this.getCellById(id);
            if (cell == null) {
                return false;
            }
            return cell.isOccupiedByDefender();
        };
        /**
         * @summary Records the player setting and returns true if a successful legal move
         * @param id - of the cell to set
         * @param isAttacker - indicates whether an attacker or a defender piece to set
         * @returns: the setting status code
         * @event:
         *      -- Invalid Move Event: A piece from either players is placed on the Malha
         *      -- Invalid Move Event: A piece is placed on an occupied cell
         */
        Board.prototype.recordPlayerSetting = function (id, isAttacker) {
            var cell = this.getCellById(id);
            if (cell == null) {
                console.log("invalid cell id passed: %s", id);
                return Kharbga.PlayerSettingStatus.ERR_INVALID_CELL;
            }
            var eventData;
            if (cell.isMalha() === true) {
                if (this.boardEvents != null) {
                    // generate event
                    eventData = new Kharbga.BoardEventData(cell, cell, id, Kharbga.BoardMoveType.SettingOnMiddleCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }
                return Kharbga.PlayerSettingStatus.ERR_MALHA;
            }
            if (cell.isOccupied() === true) {
                if (this.boardEvents != null) {
                    eventData = new Kharbga.BoardEventData(cell, cell, id, Kharbga.BoardMoveType.SettingOnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }
                return Kharbga.PlayerSettingStatus.ERR_OCCUPIED;
            }
            cell.setPiece(isAttacker);
            this.piecesSetCount++;
            return Kharbga.PlayerSettingStatus.OK;
        };
        /**
         * @summary Records the player move from fromCell to toCell if a successful move
         * @param fromCell the From Cell
         * @param toCell the To Cell
         * @returns returns the move status and the number of opponent pieces captured
         */
        Board.prototype.RecordPlayerMove = function (fromCell, toCell) {
            // can not move a surrounded cell
            if (fromCell.isSurrounded() === true) {
                if (this.boardEvents != null) {
                    var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.SelectedCellThatIsSurroundedForMoving);
                    this.boardEvents.invalidMoveEvent(eventData);
                }
                return { status: Kharbga.PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
            }
            // can not move to an occupied cell
            if (toCell.isOccupied() === true) {
                if (this.boardEvents != null) {
                    var eventData2 = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.MovingToAnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData2);
                }
                return { status: Kharbga.PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
            }
            // the To cell must be adjacent to the From Cell
            if (fromCell.isAdjacentTo(toCell) === false) {
                if (this.boardEvents != null) {
                    var eventData3 = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.MovingToNotAdjacentCell);
                    this.boardEvents.invalidMoveEvent(eventData3);
                }
                return { status: Kharbga.PlayerMoveStatus.ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL, capturedPieces: 0 };
            }
            toCell.setSameAs(fromCell);
            fromCell.clear();
            if (this.boardEvents != null) {
                var eventData4 = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.MovedToAValidCell);
                this.boardEvents.validMoveEvent(eventData4);
            }
            //
            var capturedCount = this.ProcessCapturedPieces(fromCell, toCell);
            return { status: Kharbga.PlayerMoveStatus.OK, capturedPieces: capturedCount };
        };
        /**
         * @summary Processes captured pieces by a given move. A move could capture up to 3 opponent pieces at a time
         * @param fromCell
         * @param toCell
         * @returns the number of pieces captured
         * @event  captured piece event
         */
        Board.prototype.ProcessCapturedPieces = function (fromCell, toCell) {
            var ret = 0;
            // 0. start with the To piece.
            // 1. get all cells adjacent and occupied by the opponent (opposite color)
            // 2. for each of these opponent cells, check if is "sandwiched" between the To cell type
            var toCellAdjacentCells = toCell.getAdjacentCells();
            var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.MovedToAValidCell);
            for (var _i = 0, toCellAdjacentCells_1 = toCellAdjacentCells; _i < toCellAdjacentCells_1.length; _i++) {
                var adjCell = toCellAdjacentCells_1[_i];
                if (adjCell.isEmpty() === true) {
                    continue;
                }
                if (adjCell.State() === toCell.State()) {
                    continue;
                }
                // we have an opponent piece
                if (toCell.Above() === adjCell) {
                    if (adjCell.Above() != null && adjCell.Above().State() === toCell.State()) {
                        adjCell.clear(); // remove from the player pieces
                        eventData.targetCellId = adjCell.id;
                        if (this.boardEvents != null) {
                            this.boardEvents.capturedPieceEvent(eventData);
                        }
                        ret++;
                    }
                }
                else if (toCell.Below() === adjCell) {
                    if (adjCell.Below() != null && adjCell.Below().State() === toCell.State()) {
                        adjCell.clear();
                        eventData.targetCellId = adjCell.id;
                        if (this.boardEvents != null) {
                            this.boardEvents.capturedPieceEvent(eventData);
                        }
                        ret++;
                    }
                }
                else if (toCell.Left() === adjCell) {
                    if (adjCell.Left() != null && adjCell.Left().State() === toCell.State()) {
                        adjCell.clear();
                        eventData.targetCellId = adjCell.id;
                        if (this.boardEvents != null) {
                            this.boardEvents.capturedPieceEvent(eventData);
                        }
                        ret++;
                    }
                }
                else if (toCell.Right() === adjCell) {
                    if (adjCell.Right() != null && adjCell.Right().State() === toCell.State()) {
                        adjCell.clear();
                        eventData.targetCellId = adjCell.id;
                        if (this.boardEvents != null) {
                            this.boardEvents.capturedPieceEvent(eventData);
                        }
                        ret++;
                    }
                }
            }
            return ret;
        };
        /**
         * @summary checks if all players pieces are set
         * @returns true if the setting by the players is complete. Players take turn to set 24 pieces on the board
         */
        Board.prototype.allPiecesAreSet = function () {
            return this.piecesSetCount === 48;
        };
        /**
         * @summary Clears the board from all player pieces.
         */
        Board.prototype.clear = function () {
            this.piecesSetCount = 0;
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var cell = this.getCellById(id);
                if (cell != null) {
                    cell.clear();
                }
            }
        };
        /**
         * @summary checks the board to identify a given player current positions
         * @param player - the player to check
         * @returns a list of ids of the cells occupied by the given player
         */
        Board.prototype.GetPlayerPieces = function (player) {
            var ret = new Array(24);
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var cellId = _a[_i];
                var cell = this.getCellById(cellId);
                if (cell.isOccupiedBy(player)) {
                    ret.push(cell.id);
                }
            }
            return ret;
        };
        /**
         * @summary searches for possible moves for the given player and an optional from location
         * @param player
         * @param from Id (optional)
         * @returns the possible moves for this player
         */
        Board.prototype.getPossibleMoves = function (player, fromId) {
            if (fromId === void 0) { fromId = ""; }
            // 0. Get the player occupied cells
            // 1. For each of these occupied cells, get adjacent cells
            // 2.   For each adjacent cell, get empty cells
            // 3.        For each empty cell, record a possible move from occupied cell to the empty cell
            // 4.   Check if its the optional id
            var ret = new Array();
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var cellId = _a[_i];
                var fromCell = this.getCellById(cellId);
                if (fromCell.isOccupiedBy(player)) {
                    var adjacentCells = fromCell.getAdjacentCells();
                    for (var _b = 0, adjacentCells_1 = adjacentCells; _b < adjacentCells_1.length; _b++) {
                        var toCell = adjacentCells_1[_b];
                        if (toCell.isEmpty()) {
                            ret.push(new Kharbga.GameMove(fromCell.id, toCell.id, player));
                        }
                    }
                }
                // check if this is the only cell we want to check
                if (fromId === cellId) {
                    break;
                }
            }
            return ret;
        };
        /**
         * @summary searches for moves that includes unreachable pieces (from)
         * @param player
         * @param from Id (optional)
         * @returns the possible moves for this player that are not reachable by opponent
         */
        Board.prototype.GetPossibleUnreachableMoves = function (player, fromId) {
            if (fromId === void 0) { fromId = ""; }
            // 0. Get the player occupied cells that are unreachable
            // 1. For each of these occupied cells, get adjacent cells
            // 2.   For each adjacent cell, get empty cells
            // 3.        For each empty cell, record  possible move from occupied cell to the empty cell
            // 4.   Check if its the optional id
            var ret = new Array(0);
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var cellId = _a[_i];
                var fromCell = this.getCellById(cellId);
                if (fromCell.isOccupiedBy(player)) {
                    if (!fromCell.isReachable(player)) {
                        var adjacentCells = fromCell.getAdjacentCells();
                        for (var _b = 0, adjacentCells_2 = adjacentCells; _b < adjacentCells_2.length; _b++) {
                            var toCell = adjacentCells_2[_b];
                            if (toCell.isEmpty()) {
                                ret.push(new Kharbga.GameMove(fromCell.id, toCell.id, player));
                            }
                        }
                    }
                }
                // check if this is the only cell we want to check
                if (fromId === cellId) {
                    break;
                }
            }
            return ret;
        };
        /**
         * @summary generate a invalid move event
         * @param boardMoveType - the move type
         * @param from - the from cell
         * @param to -- the to  cell
         */
        Board.prototype.RaiseBoardInvalidMoveEvent = function (boardMoveType, from, to, invalidCellId) {
            if (this.boardEvents != null) {
                var eventData = new Kharbga.BoardEventData(from, to, invalidCellId, boardMoveType);
                this.boardEvents.invalidMoveEvent(eventData);
            }
        };
        /**
         * @summary Checks if the player still have more moves to make. If a move captures an opponent piece,
         * the player is required to continue to move until there is no more moves that could capture pieces.
         * @param fromCell
         * @returns status -  true if there is at least one cell around fromCell from which a move that results in
         *   capturing at least one opponent piece could be made
         *  @returns possibleMoves to cell Ids that could make a capture
         */
        Board.prototype.StillHavePiecesToCapture = function (fromCell) {
            // to do: also return the possible move that could make a capture
            var moves = new Array();
            var ret = { status: false, possibleMoves: moves };
            // 1. look at all possible moves (to adjacent cells)
            // 2. for each move
            // 3.    check if opponent pieces could be captured by the move
            // 4.          return true if can capture the opponent piece
            // 5. return false if no capturing moves.
            var adjCells = fromCell.getAdjacentCells();
            for (var _i = 0, adjCells_1 = adjCells; _i < adjCells_1.length; _i++) {
                var cell = adjCells_1[_i];
                if (cell.isEmpty() === false) {
                    continue;
                }
                // can move here
                var toCell = cell;
                var toCellAjdCells = toCell.getAdjacentCells();
                for (var _a = 0, toCellAjdCells_1 = toCellAjdCells; _a < toCellAjdCells_1.length; _a++) {
                    var adjCell = toCellAjdCells_1[_a];
                    if (adjCell.isEmpty() === true) {
                        continue;
                    }
                    if (adjCell.State() === fromCell.State()) {
                        continue;
                    }
                    // we have an opponent piece adjacent to the cell we are moving to
                    if (toCell.Above() === adjCell) {
                        if (adjCell.Above() != null && adjCell.Above().State() === fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.id);
                        }
                    }
                    else if (toCell.Below() === adjCell) {
                        if (adjCell.Below() != null && adjCell.Below().State() === fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.id);
                        }
                    }
                    else if (toCell.Left() === adjCell) {
                        if (adjCell.Left() != null && adjCell.Left().State() === fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.id);
                        }
                    }
                    else if (toCell.Right() === adjCell) {
                        if (adjCell.Right() != null && adjCell.Right().State() === fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.id);
                        }
                    }
                }
            }
            return ret;
        };
        /**
         * @summary Searches the current player positions for pieces that could be captured by opponent player
         * @param player - the player
         * @param opponent - the opponent player
         * @returns a tuple including the search status and a list of ids of cell that could be captured if success
         */
        Board.prototype.hasCapturablePieces = function (player, opponent) {
            // to do: also return the possible move that could make a capture
            var capturables = new Array();
            var ret = { status: false, "capturables": capturables };
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var cellId = _a[_i];
                var cell = this.getCellById(cellId);
                if (!cell.isOccupiedBy(player)) {
                    continue;
                }
                if (cell.isSurrounded()) {
                    continue;
                }
                // 1. look at all player pieces
                // 2. for each piece
                // 3.    check if piece has an adjacent empty cell
                // 4.    for each adjacent empty cell
                // 5.       check if there is an adjacent opponent cell that could move to it
                // 6.       check if the opposite adjacent cell is an opponent cell
                // 7. Indicate that this piece is capturable and add to the list of capturables
                // check Left
                if (cell.Left() != null && cell.Left().isEmpty()) {
                    if (cell.Right() != null && cell.Right().isOccupiedBy(opponent) === false) {
                        if (cell.Left().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                            ret.status = true;
                        }
                    }
                }
                // check Right
                if (cell.Right() != null && cell.Right().isEmpty()) {
                    if (cell.Left() != null && cell.Left().isOccupiedBy(opponent) === false) {
                        if (cell.Right().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }
                // check up
                if (cell.Above() != null && cell.Above().isEmpty()) {
                    if (cell.Below() != null && cell.Below().isOccupiedBy(opponent) === false) {
                        if (cell.Above().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }
                // check down
                if (cell.Below() != null && cell.Below().isEmpty()) {
                    if (cell.Above() != null && cell.Above().isOccupiedBy(opponent) === false) {
                        if (cell.Below().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }
            }
            return ret;
        };
        /**
         * Checks if the given cell is capturable
         * @param player the player occupying the cell
         * @param cellId the cell id
         */
        Board.prototype.isCapturable = function (player, cellId) {
            var cell = this.getCellById(cellId);
            if (cell == null) {
                console.log("IsCapturable - Invalid cell Id : %s", cellId);
                return false;
            }
            return cell.isCapturable(player);
        };
        /**
         * @summary Records a Defender exchange. The defender's untouchable piece is twice the value of the attacker's piece
         * @param untouchablePieceId the defender piece to exchange
         * @param attackerPiece1Id the attacker 1st piece
         * @param attackerPiece2Id the attacker 2nd piece
         * @returns true of successful, false otherwise
         */
        Board.prototype.recordExchange = function (untouchablePieceId, attackerPiece1Id, attackerPiece2Id) {
            var uc = this.getCellById(untouchablePieceId);
            if (uc == null) {
                return false;
            }
            if (uc.isOccupiedByDefender() === false) {
                return false;
            }
            var ac1 = this.getCellById(attackerPiece1Id);
            if (ac1 == null) {
                return false;
            }
            // check if cell is occupied by attacker pience
            if (ac1.isOccupiedByAttacker() === false) {
                return false;
            }
            var ac2 = this.getCellById(attackerPiece2Id);
            if (ac2 == null) {
                return false;
            }
            if (ac2.isOccupiedByAttacker() === false) {
                return false;
            }
            if (ac1 === ac2) {
                // need to raise an event here
                return false;
            }
            var eventData = new Kharbga.BoardEventData(uc, uc, uc.id, Kharbga.BoardMoveType.DefenderPieceExchanged);
            uc.clear();
            this.boardEvents.exchangedPieceEvent(eventData);
            ac1.clear();
            eventData = new Kharbga.BoardEventData(ac1, ac1, ac1.id, Kharbga.BoardMoveType.DefenderPieceExchanged);
            this.boardEvents.exchangedPieceEvent(eventData);
            ac2.clear();
            eventData = new Kharbga.BoardEventData(ac2, ac2, ac2.id, Kharbga.BoardMoveType.DefenderPieceExchanged);
            this.boardEvents.exchangedPieceEvent(eventData);
            return true;
        };
        /**
         * @summary Searches for all possible settings for the game
         * @returns all possible settings for the game at this point
         */
        Board.prototype.getPossibleSettings = function () {
            var ret = new Array();
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var cell = this.cellsById[id];
                if (id !== "d4" && cell.isEmpty() === true) {
                    ret.push(id);
                }
            }
            return ret;
        };
        /**
         * @summary Searches for all possible settings near opponent pieces
         * @param {Player} player: the current player
         * @returns all possible settings close to the opponent settings
         */
        Board.prototype.getPossibleSettingsNearOpponent = function (player) {
            var ret = new Array();
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var cell = this.cellsById[id];
                if (id === "d4" || cell.isEmpty() !== true) {
                    continue;
                }
                if (cell.anyAdjacentOccupiedByOpponent(player)) {
                    ret.push(id);
                }
            }
            return ret;
        };
        return Board;
    }());
    Kharbga.Board = Board;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Represents a Kharbga Board cell.
     */
    var BoardCell = (function () {
        /**
         * @summary Board cells are created on a board of size 7 x 7
         * @param b the board
         * @param row: 0-6
         * @param col: 0-6
         */
        function BoardCell(b, row, col) {
            // examples: a1, b2, d3, etc.
            this.state = Kharbga.BoardCellState.Empty;
            this.left = null;
            this.right = null;
            this.up = null;
            this.down = null;
            if (row < 0 || row > 6) {
                alert("invalid board row: " + row);
            }
            if (col < 0 || col > 6) {
                alert("invalid board col: " + col);
            }
            this.board = b;
            this.row = row;
            this.col = col;
            this.id = BoardCell.COLUMNS[col] + BoardCell.ROWS[row];
            this.listAdjacentCells = [];
            this.state = Kharbga.BoardCellState.Empty;
        }
        /**
         * Returns the cell above or null if on the top edge
         */
        BoardCell.prototype.Above = function () {
            return this.up;
        };
        /**
         * Returns the cell below or null if on the bottom edge
         */
        BoardCell.prototype.Below = function () {
            return this.down;
        };
        /**
         * Returns the cell to the right or null if on the right edge
         */
        BoardCell.prototype.Right = function () {
            return this.right;
        };
        /**
         * Returns cell to the left or null if on the left edge
         */
        BoardCell.prototype.Left = function () {
            return this.left;
        };
        /**
         * Returns the current cell state
         */
        BoardCell.prototype.State = function () {
            return this.state;
        };
        /**
         * Checks if the current cell is occupied or not
         */
        BoardCell.prototype.isOccupied = function () {
            return this.state !== Kharbga.BoardCellState.Empty;
        };
        /**
         * Checks if the current cell is occupied by an attacker piece or not
         */
        BoardCell.prototype.isOccupiedByAttacker = function () {
            return this.state === Kharbga.BoardCellState.OccupiedByAttacker;
        };
        /**
         * Checks if the current cell is occupied by a defender piece or not
         */
        BoardCell.prototype.isOccupiedByDefender = function () {
            return this.state === Kharbga.BoardCellState.OccupiedByDefender;
        };
        /**
         * Check id the current cell is the middle cell which is left empty after each player sets their peices on the board
         * Malha means salty in Arabic.  Players are not allowed to set (seed) their piece on the salty land.
         */
        BoardCell.prototype.isMalha = function () {
            if (this.row === 3 && this.col === 3) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * @summary Sets a piece on the board with either an attacker or a defender piece
         * @param playerIsAttacker indicates whether an attacker or a defender setting
         */
        BoardCell.prototype.setPiece = function (playerIsAttacker) {
            if (playerIsAttacker) {
                this.state = Kharbga.BoardCellState.OccupiedByAttacker;
            }
            else {
                this.state = Kharbga.BoardCellState.OccupiedByDefender;
            }
        };
        /**
         * @summary Sets a piece with the same state as the give cell
         * @param cell - the cell to copy state from
         */
        BoardCell.prototype.setSameAs = function (cell) {
            this.state = cell.state;
        };
        /**
         * @summary Determines the adjacent cells and sets them for easy access from each cell
         * Called by the table ctor
         */
        BoardCell.prototype.setAdjacentCells = function (board) {
            // add check if board is null
            if (board == null) {
                alert("board is null");
                // todo: add debugging logic here
                return;
            }
            this.board = board;
            // on the same row back;
            if (this.col - 1 >= 0) {
                this.left = board.getCell(this.row, this.col - 1);
                if (this.left != null) {
                    this.listAdjacentCells.push(this.left);
                }
            }
            // on the same row forward
            if (this.col + 1 <= 6) {
                this.right = board.getCell(this.row, this.col + 1);
                if (this.right != null) {
                    this.listAdjacentCells.push(this.right);
                }
            }
            // on the same col up;
            if (this.row - 1 >= 0) {
                this.up = board.getCell(this.row - 1, this.col);
                if (this.up != null) {
                    this.listAdjacentCells.push(this.up);
                }
            }
            // on the same col down;
            if (this.row + 1 <= 6) {
                this.down = board.getCell(this.row + 1, this.col);
                if (this.down != null) {
                    this.listAdjacentCells.push(this.down);
                }
            }
        };
        /**
         * Returns the adjacent cells
         */
        BoardCell.prototype.getAdjacentCells = function () {
            return this.listAdjacentCells;
        };
        /**
         * Checks if the give cell is adjacent to this one
         * @param cell
         */
        BoardCell.prototype.isAdjacentTo = function (cell) {
            var ret = false;
            for (var i = 0; i < this.listAdjacentCells.length; i++) {
                var adjCell = this.listAdjacentCells[i];
                if (adjCell === cell) {
                    ret = true;
                    break;
                }
            }
            return ret;
        };
        /**
         * @summary Sets the cell state to empty
         */
        BoardCell.prototype.clear = function () {
            this.state = Kharbga.BoardCellState.Empty;
        };
        /**
         * @summary Checks if the cell is occupied by the given player
         * @param {Player} player - the player to check
         * @returns {boolean} true if the player is occupying the cell, false otherwise
         */
        BoardCell.prototype.isOccupiedBy = function (player) {
            switch (this.state) {
                case Kharbga.BoardCellState.Empty:
                    return false;
                case Kharbga.BoardCellState.OccupiedByAttacker:
                    return player.isAttacker === true;
                case Kharbga.BoardCellState.OccupiedByDefender:
                    return player.isAttacker === false;
                default:
                    return false;
            }
        };
        /**
         * @summary Checks if the cell is occupied by the opponent of the given player
         * @param {Player} player - the player to check
         * @returns {boolean} true if the opponent player is occupying the cell, false otherwise
         */
        BoardCell.prototype.isOccupiedByOpponent = function (player) {
            switch (this.state) {
                case Kharbga.BoardCellState.Empty:
                    return false;
                case Kharbga.BoardCellState.OccupiedByAttacker:
                    return player.isAttacker === false;
                case Kharbga.BoardCellState.OccupiedByDefender:
                    return player.isAttacker === true;
                default:
                    return false;
            }
        };
        /**
         * @summary Checks if any of the adjacent cells are occupied by player
         * @param {Player} player the player to check
         * @returns {boolean} true if any of the adjacent cells are occupied by the given player
         */
        BoardCell.prototype.anyAdjacentOccupiedBy = function (player) {
            var ret = false;
            for (var _i = 0, _a = this.listAdjacentCells; _i < _a.length; _i++) {
                var cell = _a[_i];
                if (cell.isOccupiedBy(player)) {
                    ret = true;
                    break;
                }
            }
            return ret;
        };
        /**
         * @summary Checks if any of the adjacent cells are occupied by the opponent player
         * @param {Player} player - the player to check
         * @returns true of any of the adjacent cells are occupied by the opponent player
         */
        BoardCell.prototype.anyAdjacentOccupiedByOpponent = function (player) {
            var ret = false;
            for (var _i = 0, _a = this.listAdjacentCells; _i < _a.length; _i++) {
                var cell = _a[_i];
                if (cell.isOccupiedByOpponent(player)) {
                    ret = true;
                    break;
                }
            }
            return ret;
        };
        /**
         * @summary Checks if the cell is empty
         * @returns true if the cell is empty
         */
        BoardCell.prototype.isEmpty = function () {
            return this.state === Kharbga.BoardCellState.Empty;
        };
        /**
         * @summary Checks if the cell is surrounded. A surrounded piece can not move
         * @returns true if the cell is surrounded by other pieces
         */
        BoardCell.prototype.isSurrounded = function () {
            var ret = true;
            for (var _i = 0, _a = this.listAdjacentCells; _i < _a.length; _i++) {
                var cell = _a[_i];
                if (cell.isEmpty()) {
                    ret = false;
                    break;
                }
            }
            return ret;
        };
        /**
         * @summary - checks if a cell in the state of defender requesting two (exchange request)
         */
        BoardCell.prototype.isDefenderRequestingTwo = function () {
            return this.state === Kharbga.BoardCellState.OccupiedByDefenderRequestingTwo;
        };
        /**
         * @summary Checks if the cell is reachable by opponent players from any of the directions possible
         * @returns true if reachable. false if not
         */
        BoardCell.prototype.isReachable = function (player) {
            var reachableFromUp = false;
            //   let emptyFoundUp = false;
            var ownPlayerFoundUp = false;
            var reachableFromRight = false;
            //  let emptyFoundRight = false;
            var ownPlayerFoundRight = false;
            var reachableFromLeft = false;
            // let emptyFoundLeft = false;
            var ownPlayerFoundLeft = false;
            var reachableFromBelow = false;
            //   let emptyFoundBelow = false;
            var ownPlayerFoundBelow = false;
            // check up until the edge
            var cell = this.Above();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundUp = true;
                    }
                    else {
                        if (!ownPlayerFoundUp) {
                            reachableFromUp = true;
                            return true;
                        }
                        break;
                    }
                }
                cell = cell.Above();
            }
            // check right until the edge
            cell = this.Right();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundRight = true;
                    }
                    else {
                        if (!ownPlayerFoundRight) {
                            reachableFromRight = true;
                            return true;
                        }
                        break;
                    }
                }
                cell = cell.Right();
            }
            // check left until the edge
            cell = this.Left();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundLeft = true;
                    }
                    else {
                        if (!ownPlayerFoundLeft) {
                            reachableFromLeft = true;
                            return true;
                        }
                        break;
                    }
                }
                cell = cell.Left();
            }
            // check below until the edge
            cell = this.Below();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundBelow = true;
                    }
                    else {
                        if (!ownPlayerFoundBelow) {
                            reachableFromBelow = true;
                        }
                        break;
                    }
                }
                cell = cell.Below();
            }
            return reachableFromUp || reachableFromBelow || reachableFromLeft || reachableFromRight;
        };
        /**
         * @summary Checks if the cell is capturable by an opponent player from any of the possible
         * directions
         * @param player the player to check
         * @returns true if it could be captured by the opponent
         */
        BoardCell.prototype.isCapturable = function (player) {
            // check if occupied by the player
            if (!this.isOccupiedBy(player)) {
                return false;
            }
            // look at adjacent cells if it could be captured from the top
            if (this.Above() != null && this.Above().isEmpty() &&
                this.Below() != null && this.Below().isOccupiedByOpponent(player)) {
                if (this.Above().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            // look at adjacent cells if it could be captured from below
            if (this.Below() != null && this.Below().isEmpty() &&
                this.Above() != null && this.Above().isOccupiedByOpponent(player)) {
                if (this.Below().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            // look at adjacent cells if it could be captured from the left
            if (this.Left() != null && this.Left().isEmpty() && this.Right() != null &&
                this.Right().isOccupiedByOpponent(player)) {
                if (this.Left().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            // look at adjacent cells if it could be captured from right
            if (this.Right() != null && this.Right().isEmpty() && this.Left() != null &&
                this.Left().isOccupiedByOpponent(player)) {
                if (this.Right().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            return false;
        };
        return BoardCell;
    }());
    /* Display Labels */
    BoardCell.TopLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
    BoardCell.BottomLabels = ["A", "B", "C", "D", "E", "F", "G"];
    BoardCell.COLUMNS = "abcdefg".split("");
    BoardCell.ROWS = "1234567".split("");
    Kharbga.BoardCell = BoardCell;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var BoardEventData = (function () {
        function BoardEventData(from, to, targetCellId, type) {
            if (targetCellId === void 0) { targetCellId = ""; }
            this.from = from;
            this.to = to;
            this.targetCellId = targetCellId;
            this.type = type;
        }
        return BoardEventData;
    }());
    Kharbga.BoardEventData = BoardEventData;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Defines various move error cases
     */
    var BoardMoveType;
    (function (BoardMoveType) {
        BoardMoveType[BoardMoveType["SettingOnValidCell"] = 0] = "SettingOnValidCell";
        BoardMoveType[BoardMoveType["SettingOnOccupiedCell"] = 1] = "SettingOnOccupiedCell";
        BoardMoveType[BoardMoveType["SettingOnMiddleCell"] = 2] = "SettingOnMiddleCell";
        BoardMoveType[BoardMoveType["SelectedCellThatIsSurroundedForMoving"] = 3] = "SelectedCellThatIsSurroundedForMoving";
        BoardMoveType[BoardMoveType["SelectedEmptyOrOpponentPieceForMoving"] = 4] = "SelectedEmptyOrOpponentPieceForMoving";
        BoardMoveType[BoardMoveType["MovingToAnOccupiedCell"] = 5] = "MovingToAnOccupiedCell";
        BoardMoveType[BoardMoveType["MovingToNotAdjacentCell"] = 6] = "MovingToNotAdjacentCell";
        BoardMoveType[BoardMoveType["MovedToAValidCell"] = 7] = "MovedToAValidCell";
        BoardMoveType[BoardMoveType["OpponentPieceCaptured"] = 8] = "OpponentPieceCaptured";
        BoardMoveType[BoardMoveType["InvalidCellId"] = 9] = "InvalidCellId";
        BoardMoveType[BoardMoveType["DefenderPieceExchanged"] = 10] = "DefenderPieceExchanged";
        BoardMoveType[BoardMoveType["AttackerPieceExchanged"] = 11] = "AttackerPieceExchanged";
    })(BoardMoveType = Kharbga.BoardMoveType || (Kharbga.BoardMoveType = {}));
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var ComputerPlayer = (function () {
        function ComputerPlayer() {
        }
        ComputerPlayer.prototype.generateSetting = function (aGame, playOptions) {
            var ret = new Kharbga.AnalysedGameMove();
            var settings = [];
            var currentPlayer = aGame.getCurrentPlayer();
            if (currentPlayer === null) {
                ret.ok = false;
                ret.error = "Unknown current player";
                return ret;
            }
            if (playOptions.firstSettingMustIncludeMalhaAdjacent &&
                currentPlayer.score === 0 && currentPlayer.isAttacker) {
                settings = aGame.settings_near_malha(); // possible cells adjacent to Malha if first setting
            }
            else {
                var settingNearOpponent = aGame.settings_near_opponent();
                if (currentPlayer.isAttacker) {
                    // check if settings includes any of these and prefer to set on these
                    var settings2 = aGame.settings_near_malha();
                    for (var si = 0; si < settings2.length; si++) {
                        if (settingNearOpponent.indexOf(settings2[si]) > 0) {
                            settings.push(settings2[si]);
                        }
                    }
                }
                if (settings.length === 0) {
                    var settings3 = ["d1", "e1", "c1", "a5", "a4", "a3", "c7", "d7",
                        "e7", "g5", "g4", "g3", "b5", "c6", "b3", "c2", "e2", "f3", "e6", "f5"];
                    // check if settings includes any of these and prefer to set on these
                    for (var si3 = 0; si3 < settings3.length; si3++) {
                        if (settingNearOpponent.indexOf(settings3[si3]) > 0) {
                            settings.push(settings3[si3]);
                        }
                    }
                    if (settings.length === 0) {
                        settings = settingNearOpponent;
                    }
                }
            }
            if (settings.length === 0) {
                settings = aGame.settings();
            }
            // no setting case
            if (settings == null || settings.length <= 0) {
                ret.error = "Unable to find any more settings";
                ret.possible = 0;
                return ret;
            }
            ret.from = "spare";
            if (playOptions.randomSetting) {
                var settingId = this.getRandom(0, settings.length - 1);
                ret.to = settings[settingId];
            }
            else {
                ret.to = settings[0];
            }
            ret.possible = settings.length;
            ret.possibleSettings = settings;
            ret.ok = true;
            return ret;
        };
        ComputerPlayer.prototype.generateMove = function (aGame, playOptions) {
            if (aGame == null) {
                return new Kharbga.AnalysedGameMove("", "", false, "Invalid Game");
            }
            if (aGame.is_in_setting_state()) {
                return this.generateSetting(aGame, playOptions);
            }
            if (aGame.is_in_moving_state() === false) {
                return new Kharbga.AnalysedGameMove("", "", false, "Game is not in a valid state: " + aGame.state);
            }
            var ret = new Kharbga.AnalysedGameMove("", "", true, "");
            var moves = null;
            if (playOptions.searchMovesThatCaptureOpponent) {
                moves = aGame.moves_that_capture(aGame.moveSourceRequired);
            }
            if (playOptions.searchMovesThatSaveSelf) {
                var movesThatSave = aGame.moves_that_save(aGame.moveSourceRequired);
                if (playOptions.preferMovesThatCaptureOverMovesThatSave === false && movesThatSave.length > 0) {
                    moves = movesThatSave;
                }
            }
            if (moves == null || moves.length === 0) {
                moves = aGame.moves_unreachables(aGame.moveSourceRequired);
                if (moves != null && moves.length > 0) {
                    ret.exchangeRequest = true;
                }
            }
            if (moves == null || moves.length === 0) {
                moves = aGame.moves(aGame.moveSourceRequired); // returns all possible moves
                ret.possible = moves.length;
            }
            if (moves == null || moves.length <= 0) {
                // if computer can not play -- resign or pass
                ret.ok = false;
                ret.error = "no moves found";
                ret.possible = 0;
                return ret;
            }
            var moveId = 0;
            if (aGame.moveSourceRequired != null && aGame.moveSourceRequired.length > 0) {
                for (var item = 0; item < moves.length; item++) {
                    if (moves[item].from === aGame.moveSourceRequired) {
                        moveId = item;
                        break;
                    }
                }
            }
            else {
                if (playOptions.randomMove) {
                    moveId = this.getRandom(0, moves.length - 1);
                }
            }
            // todo -- add check for game to rank the moves by score and play the one with the highest score
            var move = moves[moveId];
            ret.from = move.from;
            ret.to = move.to;
            ret.ok = true;
            ret.possible = moves.length;
            ret.possibleMoves = moves;
            //  logMessage("Game Move generated: ");
            //  logObject(gameMove);
            //   displayComputerMessage("Generated computer move: " + gameMove.from + "-" + gameMove.to);
        };
        /**
         * @summary returns a random number from the given range
         * @param {any} lower - range start
         * @param {any} upper - range to
         */
        ComputerPlayer.prototype.getRandom = function (lower, upper) {
            // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
            var percent = (Math.random() * 100);
            // this will return number between 0-99 because Math.random returns decimal number from 0-0.9929292 something like that
            // now you have a percentage, use it find out the number between your INTERVAL :upper-lower
            var num = ((percent * (upper - lower) / 100));
            // num will now have a number that falls in your INTERVAL simple maths
            num += lower;
            // add lower to make it fall in your INTERVAL
            // but num is still in decimal
            // use Math.floor>downward to its nearest integer you won't get upper value ever
            // use Math.ceil>upward to its nearest integer upper value is possible
            // math.round>to its nearest integer 2.4>2 2.5>3   both lower and upper value possible
            // console.log("upper: %s,lower: %s, num: %s, floor num: %s, ceil num: %s,
            // round num: %s", lower, upper, num, Math.floor(num), Math.ceil(num), Math.round(num));
            return Math.floor(num);
        };
        return ComputerPlayer;
    }());
    ComputerPlayer.SETTINGS_NEAR_MALHA = ["c4", "e4", "d3", "d5"];
    Kharbga.ComputerPlayer = ComputerPlayer;
})(Kharbga || (Kharbga = {}));
// https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines
var Kharbga;
// https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines
(function (Kharbga) {
    /**
     * @summary Defines the player types. We could have games where:
     * - a person plays against another person on the same computer
     * - a person plays the computer on the same computer
     * - a person plays against another person on another computer
     */
    var PlayerType;
    (function (PlayerType) {
        PlayerType[PlayerType["Person"] = 0] = "Person";
        PlayerType[PlayerType["Computer"] = 1] = "Computer";
    })(PlayerType = Kharbga.PlayerType || (Kharbga.PlayerType = {}));
    /**
     * @summary A player could be either an attacker, a defender, or spectator.
     * A spectator could make move suggestions to either players assuming they are given
     * the OK.
     */
    var PlayerRole;
    (function (PlayerRole) {
        PlayerRole[PlayerRole["Attacker"] = 0] = "Attacker";
        PlayerRole[PlayerRole["Defender"] = 1] = "Defender";
        PlayerRole[PlayerRole["Spectator"] = 2] = "Spectator";
    })(PlayerRole = Kharbga.PlayerRole || (Kharbga.PlayerRole = {}));
    /**
     * @summary defines possible returns status when setting a player pieces on the board
     */
    var PlayerSettingStatus;
    (function (PlayerSettingStatus) {
        PlayerSettingStatus[PlayerSettingStatus["OK"] = 0] = "OK";
        PlayerSettingStatus[PlayerSettingStatus["ERR_INVALID_CELL"] = 1] = "ERR_INVALID_CELL";
        PlayerSettingStatus[PlayerSettingStatus["ERR_MALHA"] = 2] = "ERR_MALHA";
        PlayerSettingStatus[PlayerSettingStatus["ERR_OCCUPIED"] = 3] = "ERR_OCCUPIED";
    })(PlayerSettingStatus = Kharbga.PlayerSettingStatus || (Kharbga.PlayerSettingStatus = {}));
    /**
     * @summary defines the the possible returns status when player makes a move
     */
    var PlayerMoveStatus;
    (function (PlayerMoveStatus) {
        PlayerMoveStatus[PlayerMoveStatus["OK"] = 0] = "OK";
        PlayerMoveStatus[PlayerMoveStatus["ERR_FROM_IS_SURROUNDED"] = 1] = "ERR_FROM_IS_SURROUNDED";
        PlayerMoveStatus[PlayerMoveStatus["ERR_TO_IS_OCCUPIED"] = 2] = "ERR_TO_IS_OCCUPIED";
        PlayerMoveStatus[PlayerMoveStatus["ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL"] = 3] = "ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL";
        PlayerMoveStatus[PlayerMoveStatus["ERR_INVALID"] = 4] = "ERR_INVALID";
    })(PlayerMoveStatus = Kharbga.PlayerMoveStatus || (Kharbga.PlayerMoveStatus = {}));
    /**
     * @summary Defines the possible states of a board cell
     */
    var BoardCellState;
    (function (BoardCellState) {
        BoardCellState[BoardCellState["Empty"] = 0] = "Empty";
        BoardCellState[BoardCellState["OccupiedByAttacker"] = 1] = "OccupiedByAttacker";
        BoardCellState[BoardCellState["OccupiedByDefender"] = 2] = "OccupiedByDefender";
        BoardCellState[BoardCellState["OccupiedByDefenderRequestingTwo"] = 3] = "OccupiedByDefenderRequestingTwo";
    })(BoardCellState = Kharbga.BoardCellState || (Kharbga.BoardCellState = {}));
    /**
     * @summary Defines piece states   -- this is now obsolete
     */
    var PieceState;
    (function (PieceState) {
        PieceState[PieceState["IsNotSetYet"] = 0] = "IsNotSetYet";
        PieceState[PieceState["IsOnBoard"] = 1] = "IsOnBoard";
        PieceState[PieceState["IsOnBoardUntouchable"] = 2] = "IsOnBoardUntouchable";
        PieceState[PieceState["IsCapturedOnBoard"] = 3] = "IsCapturedOnBoard";
        PieceState[PieceState["IsCapturedOffBoard"] = 4] = "IsCapturedOffBoard";
        PieceState[PieceState["IsExchanged"] = 5] = "IsExchanged";
    })(PieceState = Kharbga.PieceState || (Kharbga.PieceState = {}));
    /**
     * @summary define a game action type  -- used for logging mainly
     */
    var GameActionType;
    (function (GameActionType) {
        GameActionType[GameActionType["Setting"] = 0] = "Setting";
        GameActionType[GameActionType["Move"] = 1] = "Move";
        GameActionType[GameActionType["MoveCapture"] = 2] = "MoveCapture";
        GameActionType[GameActionType["DefenderRequestTwo"] = 3] = "DefenderRequestTwo";
        GameActionType[GameActionType["DefenderRequestTwoAcceptedByAttacker"] = 4] = "DefenderRequestTwoAcceptedByAttacker";
    })(GameActionType = Kharbga.GameActionType || (Kharbga.GameActionType = {}));
    /**
     *  @summary Represents the piece that players use to make their moves on the board
     */
    var Piece = (function () {
        function Piece() {
            this.state = PieceState.IsNotSetYet;
        }
        Piece.prototype.value = function () {
            if (this.state === PieceState.IsOnBoard) {
                return 1;
            }
            else if (this.state === PieceState.IsOnBoardUntouchable) {
                return 100;
            }
            else {
                return 0;
            }
        };
        return Piece;
    }());
    Kharbga.Piece = Piece;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Represents a game between two players. see readme.md for details about rules
     *
     */
    var Game = (function () {
        /*
         * @summary Initializes the game to the no started state
         */
        function Game(gameEvents, boardEvents) {
            this.attacker = new Kharbga.Attacker(); // represents the attacker
            this.defender = new Kharbga.Defender(); // represents the defender
            this.spectators = new Array(1); // spectators if any
            this.history = new Kharbga.GameHistory(); // stores the history of all moves made
            // starting with 24 pieces.
            this.numberOfSettingsAllowed = 2; // temp counter used for Settings. Players are allowed to set two pieces at a time
            this.attackerMove = 0; // not really used
            this.defenderMove = 0; // not really used
            // transitional state
            this.moveSourceRequired = ""; // the source piece required after a capture
            this.moveDestinationsPossibleCapture = null; // the possible destinations to capture
            this.firstMove = true;
            this.thinkingTimerId = -1;
            this.state = Kharbga.GameState.NotStarted;
            this.gameEvents = gameEvents;
            this.boardEvents = boardEvents;
            this.board = new Kharbga.Board(boardEvents);
            this.moveFlags = new Kharbga.GameMoveFlags();
        }
        /**
         * @summary - initializes the game
         */
        Game.prototype.init = function () {
            this.id = "";
            this.startTime = new Date();
            this.attackerMove = 0;
            this.defenderMove = 0;
            this.currentPlayer = this.attacker;
            this.state = Kharbga.GameState.Setting;
            this.firstMove = true;
            this.reset();
        };
        /**
         * @summary Starts a new game between two players on the same computer
         */
        Game.prototype.start = function () {
            this.init();
            this.reset();
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newGameStartedEvent(eventData);
            this.gameEvents.newPlayerTurnEvent(eventData);
            // start the timer for adding total thinking time for each player
            this.thinkingTimerId = setInterval(this.thinkingTimerHandler, 5, this);
        };
        Game.prototype.thinkingTimerHandler = function (game) {
            var p = game.getCurrentPlayer();
            p.totalTimeThinkingSinceStartOfGame += 5;
            return;
        };
        Game.prototype.setGameDone = function () {
            this.endTime = new Date();
            if (this.thinkingTimerId > 0) {
                clearInterval(this.thinkingTimerId);
                this.thinkingTimerId = -1;
            }
        };
        /**
         * @summary Resets the game. Clears the board and players info
         * and stops the players thinking timer
         */
        Game.prototype.reset = function () {
            this.board.clear();
            this.attacker.reset();
            this.defender.reset();
            this.winner = null;
            this.currentPlayer = this.attacker;
            this.history.reset();
            this.moveFlags.reset();
            if (this.thinkingTimerId > 0) {
                clearInterval(this.thinkingTimerId);
                this.thinkingTimerId = -1;
            }
        };
        /**
         * @summary Identifies all possible moves
         * @returns {GameMove[]} all possible moves for the current player
         */
        Game.prototype.moves = function (from) {
            if (from === void 0) { from = ""; }
            return this.board.getPossibleMoves(this.currentPlayer, from);
        };
        /**
         * @summary Searches for moves that result in a capture of one of the
         * opponent pieces for the current player
         * @param {string} from -- optional from location
         * @returns a list of possible game moves that could result in capture for the current player
         */
        Game.prototype.moves_that_capture = function (from) {
            if (from === void 0) { from = ""; }
            var temp = this.board.getPossibleMoves(this.currentPlayer, from);
            var ret = new Array();
            for (var _i = 0, temp_1 = temp; _i < temp_1.length; _i++) {
                var move = temp_1[_i];
                // check if the from cell could capture
                var fromCell = this.board.getCellById(move.from);
                if (fromCell === null) {
                    continue;
                }
                var result = this.board.StillHavePiecesToCapture(fromCell);
                if (result.status === true) {
                    if (result.possibleMoves.indexOf(move.to) >= 0) {
                        ret.push(move);
                    }
                }
            }
            return ret;
        };
        /**
         * @summary Identifies moves by capturable pieces (hopefully to save) for the current player
         * @param from - the from cell position
         * @returns - the possible moves
         */
        Game.prototype.moves_by_capturables = function (from) {
            if (from === void 0) { from = ""; }
            var temp = this.board.getPossibleMoves(this.currentPlayer, from);
            var ret = new Array();
            for (var _i = 0, temp_2 = temp; _i < temp_2.length; _i++) {
                var move = temp_2[_i];
                var capturable = this.board.isCapturable(this.currentPlayer, move.from);
                if (capturable) {
                    ret.push(move);
                }
            }
            return ret;
        };
        /**
         * Identifies moves that result in saving own pieces
         * @param from -- optional from location
         */
        Game.prototype.moves_that_save = function (from) {
            if (from === void 0) { from = ""; }
            var result = this.board.hasCapturablePieces(this.currentPlayer, this.currentPlayer.isAttacker ? this.defender : this.attacker);
            var tempMoves = this.board.getPossibleMoves(this.currentPlayer, from);
            var ret = new Array();
            // for each move -- see if the board after the move will result in less capturables
            for (var _i = 0, tempMoves_1 = tempMoves; _i < tempMoves_1.length; _i++) {
                var move = tempMoves_1[_i];
                var tempBoard = this.board.clone();
                var fromCell = tempBoard.getCellById(move.from);
                var toCell = tempBoard.getCellById(move.to);
                var moveResult = tempBoard.RecordPlayerMove(fromCell, toCell);
                var result2 = tempBoard.hasCapturablePieces(this.currentPlayer, this.currentPlayer.isAttacker ? this.defender : this.attacker);
                if (result2.capturables.length < result.capturables.length) {
                    // good move?
                    ret.push(move);
                }
                // delete tempBoard;
            }
            if (ret.length === 0) {
                ret = tempMoves;
            }
            return ret;
        };
        /**
         * @summary Identifies moves using unreachable pieces
         * @param from -- optional from location
         */
        Game.prototype.moves_unreachables = function (from) {
            if (from === void 0) { from = ""; }
            return this.board.GetPossibleUnreachableMoves(this.currentPlayer, from);
        };
        /**
         * @summary Searches for all possible settings for the game
         * @returns all possible settings
         */
        Game.prototype.settings = function () {
            if (this.is_in_setting_state() === true) {
                return this.board.getPossibleSettings();
            }
            else {
                return [];
            }
        };
        /**
         * Updates the game player names
         * @param attacker - name
         * @param defender - name
         */
        Game.prototype.setPlayerNames = function (attacker, defender) {
            this.attacker.name = attacker;
            this.defender.name = defender;
        };
        /**
         * @summary Searches for possible settings near the opening square
         * @returns all possible settings near the malha
         */
        Game.prototype.settings_near_malha = function () {
            var ret = new Array();
            for (var i = 0; i < Kharbga.ComputerPlayer.SETTINGS_NEAR_MALHA.length; i++) {
                var cell = this.board.getCellById(Kharbga.ComputerPlayer.SETTINGS_NEAR_MALHA[i]);
                if (cell.isEmpty()) {
                    ret.push(Kharbga.ComputerPlayer.SETTINGS_NEAR_MALHA[i]);
                }
            }
            return ret;
        };
        /**
         * @summary Searches for all possible settings near opponent pieces
         * @returns all possible settings close to the opponent of the current player
         */
        Game.prototype.settings_near_opponent = function () {
            return this.board.getPossibleSettingsNearOpponent(this.currentPlayer);
        };
        /**
         * @summary Checks if the current player still can set a piece
         * @returns true if the current player can still set
         */
        Game.prototype.is_current_player_setting = function () {
            if (this.state !== Kharbga.GameState.Setting) {
                return false;
            }
            return this.numberOfSettingsAllowed > 0;
        };
        /**
         * @returns the current game position - fen format
         */
        Game.prototype.fen = function () {
            return this.board.fen();
        };
        /**
         * @summary Sets the game with the given fen setting
         * @param fen
         * @returns true if valid and successful to parse
         */
        Game.prototype.set = function (fen) {
            if (this.validFen(fen) !== true) {
                return false;
            }
            // cut off any move, castling, etc info from the end
            // we're only interested in position information
            fen = fen.replace(/ .+$/, "");
            var rows = fen.split("/");
            var position = {};
            var currentRow = 7;
            for (var i = 0; i < 7; i++) {
                var row = rows[i].split("");
                var colIndex = 0;
                // loop through each character in the FEN section
                for (var j = 0; j < row.length; j++) {
                    // number / empty squares
                    if (row[j].search(/[1-7]/) !== -1) {
                        var emptySquares = parseInt(row[j], 10);
                        colIndex += emptySquares;
                    }
                    else {
                        var square = Kharbga.BoardCell.COLUMNS[colIndex] + currentRow;
                        var isAttackerPiece = this.isDefenderPiece(row[j]) === false;
                        var result = this.board.recordPlayerSetting(square, isAttackerPiece);
                        if (result !== Kharbga.PlayerSettingStatus.OK) {
                            //
                            console.log("Error loading fen: " + fen + " at square: " + square);
                            return false;
                        }
                        else {
                            if (isAttackerPiece) {
                                this.attacker.score++;
                            }
                            else {
                                this.defender.score++;
                            }
                        }
                        //  position[square] = fenToPieceCode(row[j]);
                        colIndex++;
                    }
                }
                currentRow--;
            }
            // after setting fen
            this.checkIfSettingsCompleted();
            return true;
        };
        Game.prototype.move_flags = function () {
            return this.moveFlags;
        };
        /**
         * @summary Checks if the fen piece char is an Attacker or a Defender piece.
         * Defender pieces are in lower case.
         * @param piece - the piece code
         */
        Game.prototype.isDefenderPiece = function (piece) {
            if (piece.toLowerCase() === piece) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * @summary Checks if the give game fen string is valid or not
         * @param fen - the fen string
         */
        Game.prototype.validFen = function (fen) {
            // todo: this whole function could probably be replaced with a single regex
            if (typeof fen !== "string") {
                return false;
            }
            // cut off any move, castling, etc info from the end
            // we're only interested in position information
            fen = fen.replace(/ .+$/, "");
            var chunks = fen.split("/"); // fen should be 7 sections separated by slashes
            if (chunks.length !== 7) {
                return false; // should be only 7 rows
            }
            // check the piece sections
            for (var i = 0; i < 7; i++) {
                if (chunks[i] === "" ||
                    chunks[i].length > 7 ||
                    chunks[i].search(/[^sS1-7]/) !== -1) {
                    return false;
                }
            }
            return true;
        };
        /**
         * @returns true if the game is in setting mode. false, otherwise
         */
        Game.prototype.isInSettingMode = function () {
            return this.state === Kharbga.GameState.Setting;
        };
        /**
         * @returns the game id
         */
        Game.prototype.getGameId = function () {
            return this.id;
        };
        /**
         * @summary sets the game id
         * @param id  - the game id as set in storage
         */
        Game.prototype.setGameId = function (id) {
            this.id = id;
        };
        /**
         * @summary Sets up the game with the given game state. Replays all moves sorted by number
         * @param serverGameState  -- the game state as stored including all moves
         * @param delayAfterEachMove -- delay after making the move in msec
         * @returns true if successful, false otherwise
         */
        Game.prototype.setupWith = function (serverGameState, delayAfterEachMove) {
            if (delayAfterEachMove === void 0) { delayAfterEachMove = 0; }
            var ret = false;
            this.init();
            if (serverGameState.status === Kharbga.GameStatus.Joined) {
                this.state = Kharbga.GameState.Setting;
            }
            // sort by the move number
            var sortedMoves = serverGameState.moves.sort(function (a, b) {
                // add check for dates
                if (a.number > b.number) {
                    return 1;
                }
                if (a.number < b.number) {
                    return -1;
                }
                return 0;
            });
            for (var _i = 0, sortedMoves_1 = sortedMoves; _i < sortedMoves_1.length; _i++) {
                var move = sortedMoves_1[_i];
                if (move.isSetting) {
                    this.processSetting(move.to, move.resigned);
                }
            }
            for (var _a = 0, sortedMoves_2 = sortedMoves; _a < sortedMoves_2.length; _a++) {
                var move = sortedMoves_2[_a];
                if (!move.isSetting) {
                    this.processMove(move.from, move.to, move.resigned, move.exchangeRequest);
                }
            }
            // check the players
            return ret;
        };
        /**
         * @returns the game state see GameState doc
         */
        Game.prototype.getState = function () { return this.state; };
        /**
         * @summary indicates whether the game is done or not
         * @returns true if the game is over in any of the possible game over cases
         */
        Game.prototype.game_over = function () {
            if (this.state === Kharbga.GameState.Pending || this.state === Kharbga.GameState.Setting || this.state === Kharbga.GameState.Moving) {
                return false;
            }
            else {
                return true;
            }
        };
        /**
         * @summary indicates whether the game is done or not
         */
        Game.prototype.game_setting_over = function () {
            if (this.state === Kharbga.GameState.Setting) {
                return false;
            }
            else {
                return true;
            }
        };
        /**
         * @summary Identifies who's turn it is to play
         * @returns 'a' if attacker, 'd' if defender
         */
        Game.prototype.turn = function () {
            if (this.currentPlayer == null) {
                return "";
            }
            if (this.currentPlayer.isAttacker) {
                return "a";
            }
            else {
                return "d";
            }
        };
        /**
         * @summary Checks if the cell is valid and empty
         * @param cellId - the game cell to check
         * @returns true if a valid cell and is empty, false otherwise
         */
        Game.prototype.is_empty = function (cellId) {
            var cell = this.board.getCellById(cellId);
            if (cell === null) {
                return false;
            }
            else {
                return cell.isEmpty();
            }
        };
        /**
         * @summary Checks if the cell is valid
         * @param cellId - the id of the cell to check
         * @returns true if the cell if valid, false otherwise
         */
        Game.prototype.is_valid = function (cellId) {
            var cell = this.board.getCellById(cellId);
            if (cell === null) {
                return false;
            }
            else {
                return true;
            }
        };
        /**
         * @summary Checks if the move is valid for the current player
         * @param from the id of the cell moving from
         * @param to the id of the cell to move to
         * @returns true if a valid move, false otherwise
         */
        Game.prototype.valid_move = function (from, to) {
            var fromCell = this.board.getCellById(from);
            if (fromCell == null) {
                return false;
            }
            if (!fromCell.isOccupiedBy(this.currentPlayer)) {
                return false;
            }
            var toCell = this.board.getCellById(to);
            if (toCell == null) {
                return false;
            }
            if (!toCell.isAdjacentTo(fromCell)) {
                return false;
            }
            if (!toCell.isEmpty()) {
                return false;
            }
            return true;
        };
        /**
         * @summary Checks if the cell is valid and occupied by current player
         * @param cellId the id of the cell to check
         * @returns true if occupied by the current player, false otherwise
         */
        Game.prototype.is_occupied_current_player = function (cellId) {
            var cell = this.board.getCellById(cellId);
            if (cell !== null) {
                return cell.isOccupiedBy(this.currentPlayer);
            }
            else {
                return false;
            }
        };
        /**
         * @summary checks the game status and issue the appropriate events
         */
        Game.prototype.check = function () {
            // checks the game status and generates
            this.checkPass();
            this.CheckScores();
        };
        /**
         * @summary checks if the given destination is valid for the required piece
         * @param dest - the id of the cell moving to
         * @returns true if a valid destination, false otherwise
         */
        Game.prototype.checkMoveSourceRequiredAndValidDestinations = function (dest) {
            if (this.moveDestinationsPossibleCapture == null || this.moveSourceRequired == null ||
                this.moveSourceRequired.length === 0) {
                return true;
            }
            if (this.moveDestinationsPossibleCapture.indexOf(dest) >= 0) {
                return true;
            }
            return false;
        };
        /**
         *  @returns the game history manager
         */
        Game.prototype.getHistory = function () { return this.history; };
        /**
         * @returns the current player
         */
        Game.prototype.getCurrentPlayer = function () { return this.currentPlayer; };
        Game.prototype.getAttackerScore = function () { return this.attacker.score; };
        Game.prototype.getDefenderScore = function () { return this.defender.score; };
        Game.prototype.getAttackerMoveNumber = function () { return this.attackerMove; };
        Game.prototype.getDefenderMoveNumber = function () { return this.defenderMove; };
        /**
         * @returns the startup time of the game
         */
        Game.prototype.getStartTime = function () { return this.startTime; };
        /**
         * @returns the end time of the game
         */
        Game.prototype.getEndTime = function () { return this.endTime; };
        /**
         * @summary Checks the time since the start of the game
         */
        // public TimeSpan timeSinceStartup { return DateTime.Now - _startTime; } }
        /**
         * @summary Checks the game is the winner id defined or not
         * @returns the game's winner
         */
        Game.prototype.getWinner = function () { return this.winner; };
        /**
         *  Returns the attacker
         */
        Game.prototype.getAttacker = function () { return this.attacker; };
        /**
         * Returns the defender
         */
        Game.prototype.getDefender = function () { return this.defender; };
        /**
         * @summary Adds a spectator to the game (2.0 version)
         * @param s - the spectator to add
         */
        Game.prototype.addSpectator = function (s) {
            this.spectators.push(s);
        };
        /**
         * @returns the internal board representation
         */
        Game.prototype.Board = function () { return this.board; };
        /**
         * @summary process a player setting
         * @param cellId - the cell id clicked/selected by the user
         * @param resigned flag - flag if current player indicated resigned on the move
         * @returns true if a successful setting, false otherwise
         */
        Game.prototype.processSetting = function (cellId, resigned) {
            if (resigned === void 0) { resigned = false; }
            this.moveFlags.resigned = resigned;
            var ret = this.recordSetting(cellId); // process the move first
            if (this.moveFlags.resigned === true) {
                this.processCurrentPlayerAbandoned();
            }
            return ret;
        };
        /**
         * @summary Acts on the user requested move from one cell to another
         * @param fromCellId - the cell id of the from cell
         * @param toCellId - the cell id of the to cell
         * @param resigned - current player is indicating resigning
         * @param exchangeRequest - current player is indicating move as participating in an exchange request
         * @returns true if successful, false otherwise
         */
        Game.prototype.processMove = function (fromCellId, toCellId, resigned, exchangeRequest) {
            if (this.state !== Kharbga.GameState.Moving) {
                return false;
            }
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            this.moveFlags.resigned = resigned;
            // check resigned with the move
            if (this.moveFlags.resigned) {
                this.processCurrentPlayerAbandoned();
                // return true;
            }
            // check the possible moves if a source if required
            if (this.checkMoveSourceRequiredAndValidDestinations(toCellId) === false) {
                return false;
            }
            var ret = false;
            var fromCell = this.board.getCellById(fromCellId);
            if (fromCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.InvalidCellId, null, null, fromCellId);
                return ret;
            }
            // check if the piece selected is owned by the current player
            if (fromCell.isOccupiedBy(this.getCurrentPlayer()) === false) {
                // invalid piece selected (empty square or opponent piece)
                this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, fromCell, null, fromCellId);
                return ret;
            }
            // check if the piece selected could actually move
            if (fromCell.isSurrounded()) {
                this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.SelectedCellThatIsSurroundedForMoving, fromCell, null, fromCellId);
                return ret;
            }
            var toCell = this.board.getCellById(toCellId);
            if (toCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.InvalidCellId, fromCell, toCell, toCellId);
                return ret;
            }
            eventData.from = fromCell;
            eventData.to = toCell;
            eventData.targetCellId = toCell.id;
            // de-selection move/canceling move from fromCell (could indicate piece exchange requests)
            if (fromCell === toCell) {
                this.gameEvents.newMoveCanceledEvent(eventData);
                return ret;
            }
            var result = this.board.RecordPlayerMove(fromCell, toCell);
            if (result.status === Kharbga.PlayerMoveStatus.OK) {
                var move = new Kharbga.GameMove(fromCell.id, toCell.id, this.currentPlayer);
                this.history.addMove(this.currentPlayer, fromCell.id, toCell.id);
                ret = true;
                // check if current player is defender confirming an requesting exchange request with this move
                this.checkUntouchableMoves(toCellId, exchangeRequest, eventData);
                if (this.currentPlayer.isAttacker) {
                    this.attackerMove++;
                }
                else {
                    this.defenderMove++;
                }
                //
                // 1. If the last move captured no pieces, player must change turn change turn
                // 2. If the last move captured 1 or more pieces and the same piece can continue to move and
                //    capture more pieces, the player must continue moving and capturing the opponent pieces
                //    until there are no more pieces to capture.
                //
                if (result.capturedPieces === 0) {
                    // the move is completed with no capture
                    // check untouchable exchange requests
                    /// todo fix this function checkUntouchables
                    // this.CheckUntouchableMoves(move);
                    eventData.targetCellId = toCellId;
                    this.gameEvents.newMoveCompletedEvent(eventData);
                    this.checkPlayerTurn();
                }
                else {
                    if (this.currentPlayer.isAttacker) {
                        this.defender.score -= result.capturedPieces;
                    }
                    else {
                        this.attacker.score -= result.capturedPieces;
                    }
                    // check if the player could still
                    var stillHavePiecesToCaptureResult = this.board.StillHavePiecesToCapture(toCell);
                    if (stillHavePiecesToCaptureResult.status === false) {
                        eventData.targetCellId = toCellId;
                        this.gameEvents.newMoveCompletedEvent(eventData);
                        this.moveDestinationsPossibleCapture = null;
                        this.moveSourceRequired = "";
                        this.checkPlayerTurn();
                    }
                    else {
                        eventData.targetCellId = toCell.id;
                        this.moveSourceRequired = toCell.id;
                        this.moveDestinationsPossibleCapture = stillHavePiecesToCaptureResult.possibleMoves;
                        // add event that player should continue to play since they could still capture
                        this.gameEvents.newMoveCompletedContinueSamePlayerEvent(eventData);
                    }
                }
                // check the scores and raise any possible events
                this.CheckScores();
            }
            else {
                eventData.move_status = result.status;
                this.gameEvents.invalidMoveEvent(eventData);
            }
            return ret;
        };
        /**
         * @summary  handler with call back when the move processing is completed
         * @param move the move to process
         * @param moveHandler the event handle for callback
         */
        Game.prototype.processMove2 = function (move, moveHandler) {
            var ret = this.processMove(move.from, move.to, move.resigned, move.exchangeRequest);
            if (moveHandler != null) {
                moveHandler.moveProcessed(ret, move);
            }
            return ret;
        };
        /**
         * @summary Checks if setting phase if completed
         * @returns true if the board is ready to start 2nd phase after setting
         */
        Game.prototype.checkIfSettingsCompleted = function () {
            if (this.board.allPiecesAreSet()) {
                this.state = Kharbga.GameState.Moving;
                this.firstMove = true;
                this.currentPlayer = this.attacker; // attackers start after finishing the game
                // check game options here if defender is to start
                // settingsCompletedEvent(this, null);
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);
            }
        };
        /**
         * @summary Change players turns after a move
         */
        Game.prototype.checkPlayerTurn = function () {
            if (this.currentPlayer.isAttacker) {
                this.currentPlayer = this.defender;
            }
            else {
                this.currentPlayer = this.attacker;
            }
            this.moveSourceRequired = "";
            this.moveDestinationsPossibleCapture = null;
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            // check if the player can actually move
            if (this.state === Kharbga.GameState.Moving) {
                if (this.currentPlayerIsBlocked() === true) {
                    if (this.currentPlayer.isAttacker) {
                        this.state = Kharbga.GameState.AttackerCanNotMove; // after the first move
                    }
                    else {
                        this.state = Kharbga.GameState.DefenderCanNotMove;
                    }
                    // check if this happened on the first move
                    if (this.firstMove) {
                        // declare defender as winner and end the game
                        this.winner = this.defender;
                        eventData.player = this.winner;
                        this.state = Kharbga.GameState.WinnerDeclaredDefenderIsBlocked;
                        this.setGameDone();
                        this.gameEvents.winnerDeclaredEvent(eventData);
                        return;
                    }
                    else {
                        this.gameEvents.playerPassedEvent(eventData);
                        this.state = Kharbga.GameState.Moving;
                        // change player's again
                        this.checkPlayerTurn();
                        return;
                    }
                }
                if (this.firstMove === true) {
                    this.firstMove = false;
                }
            }
            this.gameEvents.newPlayerTurnEvent(eventData);
        };
        /**
         * @summary processes that current player abandoned
         * @event  Winner Declared Event
         */
        Game.prototype.processCurrentPlayerAbandoned = function () {
            if (this.currentPlayer === this.attacker) {
                this.state = Kharbga.GameState.AttackerAbandoned;
                this.winner = this.defender;
            }
            else {
                this.state = Kharbga.GameState.DefenderAbandoned;
                this.winner = this.attacker;
            }
            this.setGameDone();
            // winnerDeclaredEvent(this, null);
            var eventData = new Kharbga.GameEventData(this, this.winner);
            this.gameEvents.winnerDeclaredEvent(eventData);
        };
        Game.prototype.CheckScores = function () {
            if (this.defender.score <= 0) {
                this.winner = this.attacker;
                this.state = Kharbga.GameState.DefenderLostAllPieces;
                this.setGameDone();
                var eventData = new Kharbga.GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            }
            else {
                if (this.attacker.score <= 0) {
                    this.state = Kharbga.GameState.AttackerLostAllPieces;
                    this.winner = this.defender;
                    this.setGameDone();
                    var eventData2 = new Kharbga.GameEventData(this, this.winner);
                    this.gameEvents.winnerDeclaredEvent(eventData2);
                }
            }
        };
        /**
         * @summary  Pass by an attacker usually indicates that the attacker likes the defender to
         *  show an untouchable piece that demands a two exchange.
         * The defender generally passes while demanding exchanges for his/her untouchables/unreachable pieces
         */
        Game.prototype.checkPass = function () {
            var bCanPass = this.checkIfCurrentPlayerCanPassTurn();
            // raise an event a new player move
            if (bCanPass) {
                // add check to see if it is OK for the player to pass
                if (this.currentPlayer.isAttacker) {
                    this.currentPlayer = this.defender;
                    if (this.moveFlags.exchangeRequest === true) {
                        // defender is requesting to pay up, but attacker can not move
                        this.winner = this.defender;
                        var eventDataDone = new Kharbga.GameEventData(this, this.winner);
                        this.state = Kharbga.GameState.AttackerCanNotMove;
                        this.setGameDone();
                        this.gameEvents.winnerDeclaredEvent(eventDataDone);
                    }
                    return;
                }
                else {
                    this.currentPlayer = this.attacker;
                }
                var eventData = new Kharbga.GameEventData(this, this.currentPlayer);
                this.gameEvents.newPlayerTurnEvent(eventData);
            }
            return bCanPass;
        };
        /**
         * @summary Checks if the current player can pass --- does not have any possible moves
         */
        Game.prototype.checkIfCurrentPlayerCanPassTurn = function () {
            var possibleMoves = this.board.getPossibleMoves(this.currentPlayer);
            if (possibleMoves.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * @summary Checks if the current player is blocked --- does not have any possible moves
         */
        Game.prototype.currentPlayerIsBlocked = function () {
            var possibleMoves = this.board.getPossibleMoves(this.currentPlayer);
            if (possibleMoves.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * @summary Records the current player request to set a piece. In order for a setting to be accepted, the
         * following conditions need to be met
         * @param cellId the id of a valid cell
         * @returns true if successful move. false otherwise
         */
        Game.prototype.recordSetting = function (cellId) {
            if (this.state !== Kharbga.GameState.Setting) {
                return false;
            }
            var recorded = this.board.recordPlayerSetting(cellId, this.getCurrentPlayer().isAttacker);
            if (recorded === Kharbga.PlayerSettingStatus.OK) {
                var cell = this.board.getCellById(cellId);
                this.numberOfSettingsAllowed--;
                this.history.addSetting(this.currentPlayer, cell.id);
                if (this.getCurrentPlayer().isAttacker === true) {
                    this.attacker.score++;
                }
                else {
                    this.defender.score++;
                }
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                eventData.from = cell;
                eventData.to = cell;
                eventData.targetCellId = cell.id;
                this.gameEvents.newSettingCompletedEvent(eventData);
                if (this.numberOfSettingsAllowed === 0) {
                    this.numberOfSettingsAllowed = 2;
                    this.checkPlayerTurn();
                }
                this.checkIfSettingsCompleted();
            }
            else {
                // create an invalid setting event
                var eventData2 = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                var cell = this.board.getCellById(cellId);
                eventData2.targetCellId = cellId;
                eventData2.from = cell;
                eventData2.to = cell;
                if (recorded === Kharbga.PlayerSettingStatus.ERR_MALHA) {
                    this.gameEvents.invalidSettingMalhaEvent(eventData2);
                }
                else {
                    if (recorded === Kharbga.PlayerSettingStatus.ERR_OCCUPIED) {
                        this.gameEvents.invalidSettingOccupiedEvent(eventData2);
                    }
                }
            }
            return recorded === Kharbga.PlayerSettingStatus.OK;
        };
        /**
         * @summary Checks the game state
         * @returns true if the game is in moving phase, false otherwise
         */
        Game.prototype.is_in_moving_state = function () {
            return this.state === Kharbga.GameState.Moving;
        };
        /**
         * @summary Checks the game state
         * @returns true if the game is in setting phase, false otherwise
         */
        Game.prototype.is_in_setting_state = function () {
            return this.state === Kharbga.GameState.Setting;
        };
        /**
         * @summary Checks if the selected piece to drag is able to move
         * @param selectedPieceId - the id of the piece to check
         */
        Game.prototype.is_surrounded_piece = function (selectedPieceId) {
            var clickedCell = this.board.getCellById(selectedPieceId);
            if (clickedCell === null) {
                return false;
            }
            return clickedCell.isSurrounded();
        };
        /**
         * @summary Checks untouchable cases and updates the move flags
         * @param targetCellId - the id of the cell to check
         * @param moveExchangeRequest
         * @param eventData
         */
        Game.prototype.checkUntouchableMoves = function (targetCellId, moveExchangeRequest, eventData) {
            // check player
            if (this.currentPlayer.isAttacker === false) {
                // case defender turned off exchange request
                if (moveExchangeRequest === false) {
                    this.moveFlags.exchangeRequestDefenderPiece = "";
                    this.moveFlags.exchangeRequestAccepted = false;
                    this.moveFlags.exchangeRequestAttackerPiece1 = "";
                    this.moveFlags.exchangeRequestAttackerPiece2 = "";
                    if (this.moveFlags.exchangeRequest) {
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.gameEvents.untouchableExchangeCanceledEvent(eventData);
                    }
                    else {
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                    }
                    return;
                }
                else {
                    // case defender is requesting an exchange request (first time after reset)
                    if (this.moveFlags.exchangeRequest === false) {
                        // case not previous exchange request was indicated
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                        return;
                    }
                    else {
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                        /// to-do: add a check if it is the same a the previous selected piece
                        if (this.moveFlags.exchangeRequestAccepted && this.moveFlags.exchangeRequestAttackerPiece1 != ''
                            && this.moveFlags.exchangeRequestAttackerPiece2 !== "") {
                            var result = this.processUntouchableTwoExchange(this.moveFlags.exchangeRequestDefenderPiece, this.moveFlags.exchangeRequestAttackerPiece1, this.moveFlags.exchangeRequestAttackerPiece2);
                            if (result === true) {
                                //
                                this.gameEvents.untouchableExchangeCompletedEvent(eventData);
                                // reset the flags after posting the event
                                this.moveFlags.reset();
                                return;
                            }
                            else {
                                this.gameEvents.untouchableExchangeCanceledEvent(eventData);
                            }
                        }
                    }
                }
            }
            else {
                // is attacker
                // case attacker turned off exchange request accepted
                if (moveExchangeRequest === false) {
                    this.moveFlags.exchangeRequestAttackerPiece1 = "";
                    this.moveFlags.exchangeRequestAttackerPiece2 = "";
                    this.moveFlags.exchangeRequestDefenderPiece = "";
                    if (this.moveFlags.exchangeRequest || this.moveFlags.exchangeRequestAccepted) {
                        // cancel if a previous exchange request was set
                        this.moveFlags.exchangeRequestAccepted = moveExchangeRequest;
                        this.gameEvents.untouchableExchangeCanceledEvent(eventData);
                    }
                    else {
                        this.moveFlags.exchangeRequestAccepted = moveExchangeRequest;
                    }
                    return;
                }
                else {
                    // attacker is accepting the exchange request
                    this.moveFlags.exchangeRequestAccepted = true;
                    if (this.moveFlags.exchangeRequestAttackerPiece1 !== "") {
                        this.moveFlags.exchangeRequestAttackerPiece2 = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                    }
                    else {
                        this.moveFlags.exchangeRequestAttackerPiece1 = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                    }
                }
            }
        };
        /** @summary Processes a request to exchange a defender piece with two of the attacker pieces
         *
         * @param untouchablePieceId - the id of the defender piece to exchange
         * @param attackerPiece1 - the id of the attacker's 1st piece to exchange
         * @param attackerPiece2 - the id of the attacker's 2nd piece to exchange
         */
        Game.prototype.processUntouchableTwoExchange = function (untouchablePieceId, attackerPiece1, attackerPiece2) {
            // steps:
            // - check if the defender piece is able to move and is not reachable
            // - check if the attacker pieces can move freely
            // if OK allow the exchange, other generate an error message using events
            var ret = this.board.recordExchange(untouchablePieceId, attackerPiece1, attackerPiece2);
            if (ret === true) {
                this.defender.score--;
                this.attacker.score--;
                this.attacker.score--;
            }
            return ret;
        };
        return Game;
    }());
    Kharbga.Game = Game;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var GameEventData = (function () {
        function GameEventData(game, currentPlayer) {
            this.source = game;
            this.player = currentPlayer;
            this.from = null;
            this.to = null;
            this.targetCellId = "";
            this.move_status = Kharbga.PlayerMoveStatus.OK;
        }
        return GameEventData;
    }());
    Kharbga.GameEventData = GameEventData;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Responsible for storing the game move history
     */
    var GameHistory = (function () {
        function GameHistory() {
            this.settings = [];
            this.moves = [];
        }
        /**
         * @summary Adds the player setting to the game history
         * @param {Player} player the player
         * @param settingCellId
         */
        GameHistory.prototype.addSetting = function (player, settingCellId) {
            var move = player.isAttacker ? "A" : "D" + ":" + settingCellId;
            this.settings.push(move);
        };
        /**
         * @summary Adds the player move to the history
         * @param {Player} player: the player
         * @param {string} fromCellId: the from cell id
         * @param {string} toCellId: the to cell id
         */
        GameHistory.prototype.addMove = function (player, fromCellId, toCellId) {
            var move = player.isAttacker ? "A" : "D" + ":" + fromCellId + "-" + toCellId;
            this.moves.push(move);
        };
        /**
         * @summary resets the game history
         */
        GameHistory.prototype.reset = function () {
            this.moves = [];
            this.settings = [];
        };
        /**
         * @summary formats the history as a JSON string
         * @returns the JSON string
         */
        GameHistory.prototype.getAsJson = function () {
            var obj = {
                settings: this.settings,
                moves: this.moves
            };
            return JSON.stringify(obj);
        };
        return GameHistory;
    }());
    Kharbga.GameHistory = GameHistory;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var GameInfo = (function () {
        function GameInfo() {
            this.reset();
        }
        GameInfo.prototype.setup = function (id, createdBy, state, status, attacker, defender) {
            this.id = id;
            this.createdBy = createdBy;
            this.state = state;
            this.status = status;
            this.moves = new Array();
            this.players = [];
            this.attacker = attacker;
            this.defender = defender;
            this.players = [this.attacker, this.defender];
        };
        GameInfo.prototype.reset = function () {
            this.id = "";
            this.nextMoveNumber = 0;
            this.moves = [];
            this.status = Kharbga.GameStatus.Created;
            this.state = Kharbga.GameState.NotStarted;
            this.defender = new Kharbga.Defender();
            this.attacker = new Kharbga.Attacker();
            this.players = [this.attacker, this.defender];
            this.isNetworkGame = false;
        };
        GameInfo.prototype.update = function (gameInfo) {
            if (gameInfo == null || gameInfo === this) {
                return;
            }
            this.id = gameInfo.id;
            this.moves = [];
            for (var _i = 0, _a = gameInfo.moves; _i < _a.length; _i++) {
                var move = _a[_i];
                this.moves.push(move);
            }
            this.status = gameInfo.status;
            this.state = gameInfo.state;
            this.attacker = gameInfo.attacker;
            this.defender = gameInfo.defender;
            this.players = [this.attacker, this.defender];
            this.nextMoveNumber = gameInfo.nextMoveNumber;
            this.isNetworkGame = gameInfo.isNetworkGame;
        };
        GameInfo.prototype.getComputerPlayer = function () {
            if (this.attacker !== null && this.attacker.isSystem === true) {
                return this.attacker;
            }
            if (this.defender !== null && this.defender.isSystem === true) {
                return this.defender;
            }
            return null;
        };
        GameInfo.prototype.newMove = function (player) {
            var ret = new Kharbga.GameMove("", "", null);
            ret.number = this.nextMoveNumber++;
            ret.player = player;
            if (player !== null) {
                ret.playerName = player.name;
            }
            return ret;
        };
        GameInfo.prototype.getNextMoveNumber = function () {
            this.nextMoveNumber++;
            return this.nextMoveNumber;
        };
        return GameInfo;
    }());
    Kharbga.GameInfo = GameInfo;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary: Defines a game move
     */
    var GameMove = (function () {
        function GameMove(from, to, p) {
            this.from = from;
            this.to = to;
            this.player = p;
            this.isSetting = false;
            this.exchangeRequest = false;
            this.beforeFen = "";
            this.afterFen = "";
            this.exchanged = "";
            this.captured = "";
            this.message = "";
            this.number = 0;
            this.playerName = "";
            this.flags = new Kharbga.GameMoveFlags();
        }
        GameMove.prototype.copyFlags = function (flags) {
            this.flags.copy(flags);
        };
        return GameMove;
    }());
    Kharbga.GameMove = GameMove;
    /**
     * @summary represents a move that is generated by the computer and is analysed for possible captures or
     * moves
     */
    var AnalysedGameMove = (function () {
        function AnalysedGameMove(from, to, ok, error) {
            if (from === void 0) { from = ""; }
            if (to === void 0) { to = ""; }
            if (ok === void 0) { ok = false; }
            if (error === void 0) { error = ""; }
            this.from = from;
            this.to = to;
            this.ok = ok;
            this.error = error;
            this.possible = 0;
        }
        return AnalysedGameMove;
    }());
    Kharbga.AnalysedGameMove = AnalysedGameMove;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Defines various parameters related to the current player move
     */
    var GameMoveFlags = (function () {
        function GameMoveFlags() {
            this.resigned = false;
            this.exchangeRequest = false;
            this.exchangeRequestAccepted = false;
            this.exchangeRequestDefenderPiece = "";
            this.exchangeRequestAttackerPiece1 = "";
            this.exchangeRequestAttackerPiece2 = "";
        }
        GameMoveFlags.prototype.reset = function () {
            this.resigned = false;
            this.exchangeRequest = false;
            this.exchangeRequestAccepted = false;
            this.exchangeRequestDefenderPiece = "";
            this.exchangeRequestAttackerPiece1 = "";
            this.exchangeRequestAttackerPiece2 = "";
        };
        GameMoveFlags.prototype.copy = function (f) {
            if (f === null) {
                return;
            }
            this.resigned = f.resigned;
            this.exchangeRequest = f.exchangeRequest;
            this.exchangeRequestAccepted = f.exchangeRequestAccepted;
            this.exchangeRequestDefenderPiece = f.exchangeRequestDefenderPiece;
            this.exchangeRequestAttackerPiece1 = f.exchangeRequestAttackerPiece1;
            this.exchangeRequestAttackerPiece2 = f.exchangeRequestAttackerPiece2;
        };
        return GameMoveFlags;
    }());
    Kharbga.GameMoveFlags = GameMoveFlags;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary defines the possible states of a game
     */
    var GameState;
    (function (GameState) {
        GameState[GameState["NotStarted"] = 0] = "NotStarted";
        GameState[GameState["Started"] = 1] = "Started";
        GameState[GameState["Pending"] = 2] = "Pending";
        /*
         * @summary - the game starts by the attacker setting his/her pieces on the board with the objective
         * of capturing the defender's pieces and limiting the defender from building up protected
         * areas where his pieces could freely move.
         * the defender's objective is to protect his pieces, capture the attacker's pieces (Agban), and
         * buildup protected areas where the attacker can not move into.
         * the defender's pieces that can freely move in these protected areas are called Untouchables (mhaffef)
         * The only way for the attacker to remove Untouchable pieces from the board is to pay the defender using
         * two of his/her own pieces. The three pieces involved in the exchange must be approved by the defender.
         * With these Untouchable pieces, the defender could win the game if the attacker can not make
         * exchanges.
         */
        GameState[GameState["Setting"] = 3] = "Setting";
        /* @summary - This is an illegal condition at the beginning of a game.
         * After setting is completed, the attacker is required to move first.
         * After the attacker's first move is completed, the defender must be
         * able to play. If the defender is blocked after the first move, the attacker loses and
         * the defender is declared a winner. After the first move by the defender, the attacker can
         * block the defender from moving. In this case, the defender must pass their turn
         * and request the attacker to continue playing until one or more pieces of the
         * defender are unblocked. In most cases, this condition results in the defender losing
         * all their pieces.
         */
        GameState[GameState["DefenderCanNotMove"] = 4] = "DefenderCanNotMove";
        /* @summary - This state happens after the first move by the defender.
         * It is a legal state and the attacker loses the game
         * in most cases. In this legal case, the defender can freely move their pieces until the
         *  attacker is unblocked and is able to play. But, they may choose to just request pay up.
         * This is why this is an automatic loss for the attacker
         */
        GameState[GameState["AttackerCanNotMove"] = 5] = "AttackerCanNotMove";
        /* After completing setting, this game goes to this state for players to start the first moves
         */
        GameState[GameState["Moving"] = 6] = "Moving";
        // in this state, the defender is able to freely move a piece in a protected area unreachable by
        // the attacker and is demanding exchanges (one piece of the defender for two pieces of the attacker). An  attacker's 
        // piece must be able to freely move in order to be able to participate in an exchange.
        GameState[GameState["DefenderMovingUntouchable"] = 7] = "DefenderMovingUntouchable";
        // the attacker abandons play and loses the game when they can not capture all of the defender's pieces. 
        // the defender's untouchable pieces are twice the value of the attacker's pieces.
        GameState[GameState["AttackerAbandoned"] = 8] = "AttackerAbandoned";
        // the defender abandons play and loses the game when all their pieces are captured
        GameState[GameState["DefenderAbandoned"] = 9] = "DefenderAbandoned";
        // defender lost all pieces.
        GameState[GameState["DefenderLostAllPieces"] = 10] = "DefenderLostAllPieces";
        // attacker lost all pieces.
        GameState[GameState["AttackerLostAllPieces"] = 11] = "AttackerLostAllPieces";
        GameState[GameState["WinnerDeclared"] = 12] = "WinnerDeclared";
        GameState[GameState["WinnerDeclaredDefenderIsBlocked"] = 13] = "WinnerDeclaredDefenderIsBlocked";
    })(GameState = Kharbga.GameState || (Kharbga.GameState = {}));
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary - Defines various game status as relating to the network/server
     */
    var GameStatus;
    (function (GameStatus) {
        // the game after just being created by one player
        GameStatus[GameStatus["Created"] = 0] = "Created";
        // after it gets joined by another player or system
        GameStatus[GameStatus["Joined"] = 1] = "Joined";
        // active between two players after the first attacker's move
        GameStatus[GameStatus["Active"] = 2] = "Active";
        // completed and a winner was determined
        GameStatus[GameStatus["Completed"] = 3] = "Completed";
        // one of the user disconnected
        GameStatus[GameStatus["Disconnected"] = 4] = "Disconnected";
    })(GameStatus = Kharbga.GameStatus || (Kharbga.GameStatus = {}));
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    /**
     * @summary Represents a game player. The game is played by two players, an attacker and a defender.
     * Players use 24 game pieces to set the board.
     * The players take turns in setting the board two pieces each turn.
     * After the board is set, players take turns to make game moves capturing each others pieces or demanding exchanges.
     *  the Attacker has the
     * advantages of setting his two pieces first.   The Defender follows a setting strategy so their pieces
     *  do not get captured by the Attacker.
     */
    var Player = (function () {
        function Player(isComputer, isAttacker, isSpectator) {
            if (isComputer === void 0) { isComputer = false; }
            if (isAttacker === void 0) { isAttacker = true; }
            if (isSpectator === void 0) { isSpectator = false; }
            this.totalTimeThinkingSinceStartOfGame = 0;
            this.isAttacker = isAttacker;
            this.isSystem = isComputer;
            this.isSpectator = isSpectator;
            this.score = 0;
            this.totalTimeThinkingSinceStartOfGame = 0;
            this.color = "";
            this.emailAddress = "";
            this.imageUrl = "";
        }
        Player.prototype.reset = function () {
            this.totalTimeThinkingSinceStartOfGame = 0;
            this.score = 0;
        };
        return Player;
    }());
    Kharbga.Player = Player;
    /**
     * @summary The attacker is the first one who starts the setting and the one that makes the first move
     *
     */
    var Attacker = (function (_super) {
        __extends(Attacker, _super);
        function Attacker() {
            var _this = _super.call(this, false, true, false) || this;
            _this.name = "Attacker";
            return _this;
        }
        return Attacker;
    }(Player));
    Kharbga.Attacker = Attacker;
    /**
     * @summary The Defender follows the attacker setting and moves. Demands exchanges.
     */
    var Defender = (function (_super) {
        __extends(Defender, _super);
        function Defender() {
            var _this = _super.call(this, false, false, false) || this;
            _this.name = "Defender";
            return _this;
        }
        return Defender;
    }(Player));
    Kharbga.Defender = Defender;
    /**
     * @summary Represents a player in the system that automatically generates a possible move
     *    given an existing game state
     */
    var SystemPlayer = (function (_super) {
        __extends(SystemPlayer, _super);
        function SystemPlayer(asAttacker) {
            var _this = _super.call(this, true, asAttacker, false) || this;
            _this.name = "System";
            return _this;
        }
        return SystemPlayer;
    }(Player));
    Kharbga.SystemPlayer = SystemPlayer;
    /**
     * @summary Represents a spectator watching the game
     *    given an existing game state
     */
    var Spectator = (function (_super) {
        __extends(Spectator, _super);
        function Spectator() {
            var _this = _super.call(this, false, false, true) || this;
            _this.name = "Spectator";
            return _this;
        }
        return Spectator;
    }(Player));
    Kharbga.Spectator = Spectator;
})(Kharbga || (Kharbga = {}));
//# sourceMappingURL=kharbga.js.map