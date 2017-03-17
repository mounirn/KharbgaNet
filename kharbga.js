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
/**
 * Defines the player types. We could have games where:
 * - a person plays against another person
 * - a computer plays against another computer
 * - a person plays against a computer
 */
var PlayerType;
(function (PlayerType) {
    PlayerType[PlayerType["Person"] = 0] = "Person";
    PlayerType[PlayerType["Computer"] = 1] = "Computer";
})(PlayerType || (PlayerType = {}));
/**
 * A player could be either an attacker, a defender, or spectator.
 * A spectator could make move suggestions to either players assuming they are given
 * the OK.
 */
var PlayerRole;
(function (PlayerRole) {
    PlayerRole[PlayerRole["Attacker"] = 0] = "Attacker";
    PlayerRole[PlayerRole["Defender"] = 1] = "Defender";
    PlayerRole[PlayerRole["Spectator"] = 2] = "Spectator";
})(PlayerRole || (PlayerRole = {}));
var PlayerSettingStatus;
(function (PlayerSettingStatus) {
    PlayerSettingStatus[PlayerSettingStatus["OK"] = 0] = "OK";
    PlayerSettingStatus[PlayerSettingStatus["ERR_INVALID_CELL"] = 1] = "ERR_INVALID_CELL";
    PlayerSettingStatus[PlayerSettingStatus["ERR_MALHA"] = 2] = "ERR_MALHA";
    PlayerSettingStatus[PlayerSettingStatus["ERR_OCCUPIED"] = 3] = "ERR_OCCUPIED";
})(PlayerSettingStatus || (PlayerSettingStatus = {}));
var PlayerMoveStatus;
(function (PlayerMoveStatus) {
    PlayerMoveStatus[PlayerMoveStatus["OK"] = 0] = "OK";
    PlayerMoveStatus[PlayerMoveStatus["ERR_FROM_IS_SURROUNDED"] = 1] = "ERR_FROM_IS_SURROUNDED";
    PlayerMoveStatus[PlayerMoveStatus["ERR_TO_IS_OCCUPIED"] = 2] = "ERR_TO_IS_OCCUPIED";
    PlayerMoveStatus[PlayerMoveStatus["ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL"] = 3] = "ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL";
})(PlayerMoveStatus || (PlayerMoveStatus = {}));
/**
 * Defines the possible states of a cell
 */
var BoardCellState;
(function (BoardCellState) {
    BoardCellState[BoardCellState["Empty"] = 0] = "Empty";
    BoardCellState[BoardCellState["OccupiedByAttacker"] = 1] = "OccupiedByAttacker";
    BoardCellState[BoardCellState["OccupiedByDefender"] = 2] = "OccupiedByDefender";
    BoardCellState[BoardCellState["OccupiedByDefenderRequestingTwo"] = 3] = "OccupiedByDefenderRequestingTwo";
})(BoardCellState || (BoardCellState = {}));
/// <summary>
/// Defines various move error cases
/// </summary>
var BoardMoveType;
(function (BoardMoveType) {
    BoardMoveType[BoardMoveType["SettingOnValidCell"] = 0] = "SettingOnValidCell";
    BoardMoveType[BoardMoveType["SettingOnOccupiedCell"] = 1] = "SettingOnOccupiedCell";
    BoardMoveType[BoardMoveType["SettingOnMiddleCell"] = 2] = "SettingOnMiddleCell";
    BoardMoveType[BoardMoveType["SelectedCellThatIsSourroundedForMoving"] = 3] = "SelectedCellThatIsSourroundedForMoving";
    BoardMoveType[BoardMoveType["SelectedEmptyOrOpponentPieceForMoving"] = 4] = "SelectedEmptyOrOpponentPieceForMoving";
    BoardMoveType[BoardMoveType["MovingToAnOccupiedCell"] = 5] = "MovingToAnOccupiedCell";
    BoardMoveType[BoardMoveType["MovingToNotAjacentcell"] = 6] = "MovingToNotAjacentcell";
    BoardMoveType[BoardMoveType["MovedToAValidCell"] = 7] = "MovedToAValidCell";
    BoardMoveType[BoardMoveType["OpponentPieceCaptured"] = 8] = "OpponentPieceCaptured";
})(BoardMoveType || (BoardMoveType = {}));
;
/**
 * Players
 */
var PieceState;
(function (PieceState) {
    PieceState[PieceState["IsNotSetYet"] = 0] = "IsNotSetYet";
    PieceState[PieceState["IsOnBoard"] = 1] = "IsOnBoard";
    PieceState[PieceState["IsOnBoardUntouchable"] = 2] = "IsOnBoardUntouchable";
    PieceState[PieceState["IsCapturedOnBoard"] = 3] = "IsCapturedOnBoard";
    PieceState[PieceState["IsCapturedOffBoard"] = 4] = "IsCapturedOffBoard";
    PieceState[PieceState["IsExchanged"] = 5] = "IsExchanged";
})(PieceState || (PieceState = {}));
/**
 * Represents a game player. The game is played by two players, an attacker and a defender. Players use 24 game pieces to set the board.
 * The players take turns in setting the board two pieces each turn.
 * After the board is set, players take turns to make game mvoes capturing each other pices or demanding exchanges. the Attacker has the
 * advantages of setting his two pieces first.   The Defender follows a setting strategy so their pieces do not get captured by the Attacker.
 */
var Player = (function () {
    function Player(role) {
        this.occupiedCells = new Array(24);
        this.type = PlayerType.Person;
        this.role = role;
    }
    /// A player could be either an attacker or a defender
    Player.prototype.IsAttacker = function () { return this.role == PlayerRole.Attacker; };
    Player.prototype.IsDefender = function () { return this.role == PlayerRole.Defender; };
    Player.prototype.Type = function () { return this.type; };
    Player.prototype.Role = function () { return this.role; };
    Player.prototype.Reset = function () {
        this.toalTimeThinkingSinceStartOfGame = 0;
    };
    return Player;
}());
/**
 * The attacker is the first one who starts the setting and the one that makes the first move
 *
 */
var Attacker = (function (_super) {
    __extends(Attacker, _super);
    function Attacker() {
        return _super.call(this, PlayerRole.Attacker) || this;
    }
    return Attacker;
}(Player));
/**
 * Defender follows the attacker setting
 */
var Defender = (function (_super) {
    __extends(Defender, _super);
    function Defender() {
        return _super.call(this, PlayerRole.Defender) || this;
    }
    return Defender;
}(Player));
/// <summary>
/// Reprsents the piece that players use to make their moves on the board
/// </summary>
var Piece = (function () {
    function Piece() {
        this.state = PieceState.IsNotSetYet;
    }
    Piece.prototype.State = function () {
        return this.state;
    };
    Piece.prototype.Value = function () {
        if (this.State() == PieceState.IsOnBoard)
            return 1;
        else if (this.State() == PieceState.IsOnBoardUntouchable)
            return 100;
        else
            return 0;
    };
    return Piece;
}());
var GameMove = (function () {
    function GameMove(from, to, p) {
        this.From = from;
        this.To = to;
        this.Player = p;
    }
    return GameMove;
}());
/**
 * Represents the game baord composed of a 7 by 7 cells
 * The board is set by players pieces at
 */
var Board = (function () {
    function Board() {
        this.UseArabicIds = false;
        this.cells = new BoardCell[7][7]; // Rows and Columns
        // Dictionary<string, BoardCell> _dictCells = new Dictionary<string, BoardCell>(49);
        // The cells dictionary accessed by cell ID
        this.cellsById = new Object();
        // Keeps track of the number of player pieces set on the board
        this.piecesSetCount = 0;
        this.UseArabicIds = false; // default
        for (var r = 0; r < 7; r++) {
            for (var c = 0; c < 7; c++) {
                var cell = new BoardCell(this, r, c);
                this.cells[r][c] = cell;
                this.cellsById[cell.ID()] = cell;
            }
        }
        this._cellIds = Object.keys(this.cellsById);
        // Process the board to set adjacent cells
        for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
            var id = _a[_i];
            var cell = this.cellsById[id];
            cell.SetAdjacentCells(this);
        }
    }
    /**
      * Returns the cell by row and column numbers
      *
      */
    Board.prototype.GetCell = function (row, col) {
        ///Add checks for the row and col
        return this.cells[row][col];
    };
    /**
     * Returns the cell by a cell Id
     */
    Board.prototype.GetCellById = function (id) {
        return this.cellsById[id];
    };
    Board.prototype.CellIds = function () {
        return this._cellIds;
    };
    Board.prototype.IsOccupiedByAttacker = function (id) {
        var cell = this.GetCellById(id);
        if (cell != null)
            return cell.IsOccupiedByAttacker();
        else
            return false;
    };
    Board.prototype.IsOccupiedByDefender = function (id) {
        var cell = this.GetCellById(id);
        if (cell != null)
            return cell.IsOccupiedByDefender();
        else
            return false;
    };
    /**
     * Records the player setting
     * Returns true if a successful legal move
     * @param id - the cell id
     * @param isAttacker - indicates whether an attacker or a defender piece
     * @returns: the setting status code
     * events:
     *      -- A piece from either players is placed on the Malha
     *      -- A piece is placed on an occupied cell
     */
    Board.prototype.RecordPlayerSetting = function (id, isAttacker) {
        var cell = this.GetCellById(id);
        if (cell == null)
            return PlayerSettingStatus.ERR_INVALID_CELL;
        if (cell.IsMalha) {
            // generate event
            //   BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SettingOnMiddleCell,
            //    id, string.Empty, string.Empty));
            return PlayerSettingStatus.ERR_MALHA;
        }
        if (cell.IsOccupied) {
            //BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SettingOnOccupiedCell,
            //    id, string.Empty, string.Empty));
            return PlayerSettingStatus.ERR_OCCUPIED;
        }
        cell.SetPiece(isAttacker);
        this.piecesSetCount++;
        return PlayerSettingStatus.OK;
    };
    /**
     * Records the player move from fromCell to toCell if a successful move
     * @param fromCell the From Cell
     * @param toCell the To Cell
     * @returns returns the move status and the number of captured
     */
    Board.prototype.RecordPlayerMove = function (fromCell, toCell) {
        // can not move a surronded cell
        if (fromCell.IsSurrounded) {
            //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SelectedCellThatIsSourroundedForMoving, fromCell.ID, toCell.ID, string.Empty));
            return { status: PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
        }
        // can not move to an occupied cell
        if (toCell.IsOccupied) {
            //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToAnOccupiedCell, fromCell.ID, toCell.ID, string.Empty));
            return { status: PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
        }
        // the To cell must be adjacent to the From Cell
        if (!fromCell.IsAdjacentTo(toCell)) {
            //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell,  fromCell.ID, toCell.ID, string.Empty));
            return { status: PlayerMoveStatus.ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL, capturedPieces: 0 };
        }
        toCell.SetSameAs(fromCell);
        fromCell.Clear();
        // BoardMovedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovedToAValidCell, fromCell.ID, toCell.ID, string.Empty));
        //
        var capturedCount = this.ProcessCapturedPieces(fromCell, toCell);
        return { status: PlayerMoveStatus.OK, capturedPieces: capturedCount };
        ;
    };
    /**
     * Processes captured pieces by given move
     * @param fromCell
     * @param toCell
     * @returns reutns the number of pieces captured
     */
    Board.prototype.ProcessCapturedPieces = function (fromCell, toCell) {
        var ret = 0;
        //0. Start with the To piece. 
        //1. Get all cells adjacent and occupied by the opponent (opposite color)
        //2. For each of these Opponent Cells, check if is is between 
        //   the to piece and a piece of the same type
        var toCellAdjacentCells = toCell.GetAdjacentCells();
        for (var _i = 0, toCellAdjacentCells_1 = toCellAdjacentCells; _i < toCellAdjacentCells_1.length; _i++) {
            var adjCell = toCellAdjacentCells_1[_i];
            if (adjCell.IsEmpty())
                continue;
            if (adjCell.State == toCell.State)
                continue;
            // We have an opponent piece 
            if (toCell.Above() == adjCell) {
                if (adjCell.Above() != null && adjCell.Above().State() == toCell.State()) {
                    adjCell.Clear(); // Remove from the player pieces
                    //BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                    ret++;
                }
            }
            else if (toCell.Below() == adjCell) {
                if (adjCell.Below() != null && adjCell.Below().State() == toCell.State()) {
                    adjCell.Clear();
                    // BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                    ret++;
                }
            }
            else if (toCell.Left() == adjCell) {
                if (adjCell.Left() != null && adjCell.Left().State() == toCell.State()) {
                    adjCell.Clear();
                    //BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                    ret++;
                }
            }
            else if (toCell.Right() == adjCell) {
                if (adjCell.Right() != null && adjCell.Right().State() == toCell.State()) {
                    adjCell.Clear();
                    //BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                    ret++;
                }
            }
        }
        return ret;
    };
    /**
     * returns true if the setting by the players is complete. Players take turn to set 24 pieces on the baord
     */
    Board.prototype.AllPiecesAreSet = function () {
        return this.piecesSetCount == 48;
    };
    /**
     * Clears the board from all player pieces.
     */
    Board.prototype.Clear = function () {
        this.piecesSetCount = 0;
        for (var id in Object.keys(this.cellsById)) {
            var cell = this.GetCellById(id);
            if (cell != null)
                cell.Clear();
        }
    };
    /**
     * returns a list of cells occupied by the given player
     * @param player
     */
    Board.prototype.GetPlayerPieces = function (player) {
        var ret = new Array(24);
        for (var cellId in Object.keys(this.cellsById)) {
            var cell = this.GetCellById(cellId);
            if (cell.IsOccupiedBy(player)) {
                ret.push(cell.ID());
            }
        }
        return ret;
    };
    /// <summary>
    /// Returns the possible moves for this player
    /// </summary>
    /// <returns>a list of moves</returns>
    Board.prototype.GetPossibleMoves = function (player) {
        // 0. Get the player occupied cells
        // 1. For each of these cell get adjacenet cells
        // 2.   For each adjacent cell, get empty cells
        // 3        For each empty cell, record a possible move from occupied cell to the empty cell
        var ret = new Array(5);
        var cellIds = this.CellIds();
        for (var _i = 0, cellIds_1 = cellIds; _i < cellIds_1.length; _i++) {
            var cellId = cellIds_1[_i];
            var fromCell = this.GetCellById(cellId);
            if (fromCell.IsOccupiedBy(player)) {
                var adjacentCells = fromCell.GetAdjacentCells();
                for (var _a = 0, adjacentCells_1 = adjacentCells; _a < adjacentCells_1.length; _a++) {
                    var toCell = adjacentCells_1[_a];
                    if (!toCell.IsOccupied) {
                        ret.push(new GameMove(fromCell.ID(), toCell.ID(), player));
                    }
                }
            }
        }
        return ret;
    };
    Board.prototype.RaiseBoardInvalidMoveEvent = function (boardMoveType, from, to) {
        //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(boardMoveType, from != null ? from.ID : string.Empty, to != null ? to.ID : string.Empty, string.Empty));
    };
    /**
     * Checks if the player still have more moves to make. If a move captures an opponent piece, the player is required
     * to continue to move until there is no more moves that could capture pieces.
     * @param fromCell
     * @returns true if there is at least one cell around fromCell from which a move that results in
     *             capturing at least one opponent piece could be made
     */
    /// <returns>
    /// </returns>
    Board.prototype.StillHavePiecesToCapture = function (fromCell) {
        var ret = false;
        // 1. look at all possible moves (to adjacent cells)
        // 2. for each move
        // 3.    check if oppponent pieces could be captured by the move
        // 4.          return true if can capture the opponent piece
        // 5. return false if no capturing moves.
        var adjCells = fromCell.GetAdjacentCells();
        for (var _i = 0, adjCells_1 = adjCells; _i < adjCells_1.length; _i++) {
            var cell = adjCells_1[_i];
            if (!cell.IsEmpty)
                continue;
            // can move here
            var toCell = cell;
            var toCellAjdCells = toCell.GetAdjacentCells();
            for (var _a = 0, toCellAjdCells_1 = toCellAjdCells; _a < toCellAjdCells_1.length; _a++) {
                var adjCell = toCellAjdCells_1[_a];
                if (adjCell.IsEmpty)
                    continue;
                if (adjCell.State() == fromCell.State())
                    continue;
                // We have an opponent piece adjacent to the cell we are moving to
                if (toCell.Above() == adjCell) {
                    if (adjCell.Above() != null && adjCell.Above().State() == fromCell.State()) {
                        return true;
                        // Remove from the player pieces
                    }
                }
                else if (toCell.Below() == adjCell) {
                    if (adjCell.Below != null && adjCell.Below().State() == fromCell.State()) {
                        return true;
                    }
                }
                else if (toCell.Left() == adjCell) {
                    if (adjCell.Left() != null && adjCell.Left().State() == fromCell.State()) {
                        return true;
                    }
                }
                else if (toCell.Right() == adjCell) {
                    if (adjCell.Right() != null && adjCell.Right().State() == fromCell.State()) {
                        return true;
                    }
                }
            }
        }
        return ret;
    };
    /**
     * Records a Defender exchange. The defender's untouchable piece is twice the value of the attacker's piece
     * @param untouchablePieceId
     * @param attackerPiece1Id
     * @param attackerPiece2Id
     */
    Board.prototype.RecordExchange = function (untouchablePieceId, attackerPiece1Id, attackerPiece2Id) {
        var uc = this.GetCellById(untouchablePieceId);
        var ac1 = this.GetCellById(attackerPiece1Id);
        var ac2 = this.GetCellById(attackerPiece2Id);
        uc.Clear();
        ac1.Clear();
        ac2.Clear();
        //BoardExchangedPieceEvent(this, new BoardUntouchableExchangeEventArgs(untouchablePieceId, attackerPiece1Id,attackerPiece2Id));
    };
    return Board;
}());
var BoardCell = (function () {
    /**
     * Board cells are created by the board
     * @param b
     * @param row
     * @param col
     */
    function BoardCell(b, row, col) {
        this.state = BoardCellState.Empty;
        this.left = null;
        this.right = null;
        this.up = null;
        this.down = null;
        this.board = b;
        this.row = row;
        this.col = col;
        this.id = BoardCell.LeftLabels[row] + (col + 1).toString();
        // setup adjacent cells
        //  this.SetAdjacentCells(b);
    }
    /**
     *  Returns the row 0-6
     */
    BoardCell.prototype.Row = function () {
        return this.row;
    };
    /**
     * Returns The col from 0-6
     */
    BoardCell.prototype.Col = function () {
        return this.col;
    };
    /**
     * the ID in the format "RowCol" where Row are letters from A-G or alif to to kha.
     * and Col from 1-7
     */
    BoardCell.prototype.ID = function () {
        return this.id;
    };
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
    BoardCell.prototype.IsOccupied = function () {
        return this.state == BoardCellState.Empty;
    };
    /**
     * Checks if the current cell is occupied by an attacker piece or not
     */
    BoardCell.prototype.IsOccupiedByAttacker = function () {
        return this.state == BoardCellState.OccupiedByAttacker;
    };
    /**
     * Checks if the current cell is occupied by a defender piece or not
     */
    BoardCell.prototype.IsOccupiedByDefender = function () {
        return this.state == BoardCellState.OccupiedByDefender;
    };
    /**
     * Check id the current cell is the middle cell which is left empty after each player sets their peices on the board
     * Malha means salty in Arabic.  Players are not allowed to set (seed) their piece on the salty land.
     */
    BoardCell.prototype.IsMalha = function () {
        if (this.row == 3 && this.col == 3)
            return true;
        else
            return false;
    };
    /**
     * Set a piece on the board with either an attacker or a defender piece
     * @param playerIsAttacker indicates whether an attacker or a defender setting
     */
    BoardCell.prototype.SetPiece = function (playerIsAttacker) {
        if (playerIsAttacker)
            this.state = BoardCellState.OccupiedByAttacker;
        else
            this.state = BoardCellState.OccupiedByDefender;
    };
    /**
     *  set a piece with the same state as the give cell
     * @param cell
     */
    BoardCell.prototype.SetSameAs = function (cell) {
        this.state = cell.state;
    };
    /**
     * Determines the adjacent cells and sets then for easy access from each cell
     */
    BoardCell.prototype.SetAdjacentCells = function (board) {
        // add check if board is null
        if (board == null) {
            alert("board is null");
            //TODO: add debugging logic here
            return;
        }
        // On the same row back;
        if (this.col - 1 >= 0) {
            this.left = board.GetCell(this.Row(), this.Col() - 1);
            if (this.left != null)
                this.listAdjacentCells.push(this.left);
        }
        // On the same row forward
        if (this.col + 1 <= 6) {
            this.right = board.GetCell(this.Row(), this.Col() + 1);
            if (this.right != null)
                this.listAdjacentCells.push(this.right);
        }
        // On the same col up;
        if (this.row - 1 >= 0) {
            this.up = board.GetCell(this.Row() - 1, this.Col());
            if (this.up != null)
                this.listAdjacentCells.push(this.up);
        }
        // On the same col down;
        if (this.row + 1 <= 6) {
            this.down = board.GetCell(this.Row() + 1, this.Col());
            if (this.down != null)
                this.listAdjacentCells.push(this.down);
        }
    };
    /**
     * Returns the adjacent cells
     */
    BoardCell.prototype.GetAdjacentCells = function () {
        return this.listAdjacentCells;
    };
    /**
     * Checks if the give cell is adjacent to this one
     * @param cell
     */
    BoardCell.prototype.IsAdjacentTo = function (cell) {
        this.listAdjacentCells.forEach(function (e) {
            if (e == cell)
                return true;
        });
        return false;
    };
    BoardCell.prototype.Clear = function () {
        this.state = BoardCellState.Empty;
    };
    BoardCell.prototype.IsOccupiedBy = function (player) {
        switch (this.state) {
            case BoardCellState.Empty:
                return false;
            case BoardCellState.OccupiedByAttacker:
                return player.IsAttacker();
            case BoardCellState.OccupiedByDefender:
                return player.IsDefender();
            default:
                return false;
        }
    };
    BoardCell.prototype.IsEmpty = function () {
        return this.state == BoardCellState.Empty;
    };
    /**
     * A surrounded piece can not move
     */
    BoardCell.prototype.IsSurrounded = function () {
        var ret = true;
        this.listAdjacentCells.forEach(function (e) {
            if (e.IsEmpty) {
                ret = false;
                return;
            }
        });
        return ret;
    };
    BoardCell.prototype.IsDefenderRequestingTwo = function () {
        return this.state == BoardCellState.OccupiedByDefenderRequestingTwo;
    };
    return BoardCell;
}());
BoardCell.RightLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
BoardCell.LeftLabels = ["A", "B", "C", "D", "E", "F", "G"];
