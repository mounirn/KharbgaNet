var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Kharbga;
(function (Kharbga) {
    var Board = (function () {
        function Board(events) {
            this.UseArabicIds = false;
            this.cellsById = new Object();
            this.piecesSetCount = 0;
            this.UseArabicIds = false;
            this.boardEvents = events;
            this.cells = [];
            for (var r = 0; r < 7; r++) {
                this.cells[r] = [];
                for (var c = 0; c < 7; c++) {
                    var cell = new Kharbga.BoardCell(this, r, c);
                    this.cells[r][c] = cell;
                    this.cellsById[cell.ID()] = cell;
                }
            }
            this._cellIds = Object.keys(this.cellsById);
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var cell = this.cellsById[id];
                cell.SetAdjacentCells(this);
            }
        }
        Board.prototype.fen = function () {
            var ret = "";
            for (var r = 6; r >= 0; r--) {
                for (var c = 0; c < 7; c++) {
                    var cell = this.cells[r][c];
                    if (cell.IsEmpty())
                        ret += '1';
                    else if (cell.IsOccupiedByAttacker())
                        ret += 'S';
                    else if (cell.IsOccupiedByDefender())
                        ret += 's';
                }
                if (r != 0)
                    ret += '/';
            }
            ret = ret.replace(/1111111/g, '7');
            ret = ret.replace(/111111/g, '6');
            ret = ret.replace(/11111/g, '5');
            ret = ret.replace(/1111/g, '4');
            ret = ret.replace(/111/g, '3');
            ret = ret.replace(/11/g, '2');
            return ret;
        };
        Board.prototype.GetCell = function (row, col) {
            return this.cells[row][col];
        };
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
        Board.prototype.RecordPlayerSetting = function (id, isAttacker) {
            var cell = this.GetCellById(id);
            if (cell == null) {
                console.log("invalid cell id passed: %s", id);
                return Kharbga.PlayerSettingStatus.ERR_INVALID_CELL;
            }
            if (cell.IsMalha()) {
                var eventData = new Kharbga.BoardEventData(cell, cell, id, Kharbga.BoardMoveType.SettingOnMiddleCell);
                this.boardEvents.invalidMoveEvent(eventData);
                return Kharbga.PlayerSettingStatus.ERR_MALHA;
            }
            if (cell.IsOccupied()) {
                var eventData = new Kharbga.BoardEventData(cell, cell, id, Kharbga.BoardMoveType.SettingOnOccupiedCell);
                this.boardEvents.invalidMoveEvent(eventData);
                return Kharbga.PlayerSettingStatus.ERR_OCCUPIED;
            }
            cell.SetPiece(isAttacker);
            this.piecesSetCount++;
            return Kharbga.PlayerSettingStatus.OK;
        };
        Board.prototype.RecordPlayerMove = function (fromCell, toCell) {
            if (fromCell.IsSurrounded) {
                var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.ID(), Kharbga.BoardMoveType.SelectedCellThatIsSourroundedForMoving);
                this.boardEvents.invalidMoveEvent(eventData);
                return { status: Kharbga.PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
            }
            if (toCell.IsOccupied) {
                var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.ID(), Kharbga.BoardMoveType.MovingToAnOccupiedCell);
                this.boardEvents.invalidMoveEvent(eventData);
                return { status: Kharbga.PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
            }
            if (!fromCell.IsAdjacentTo(toCell)) {
                var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.ID(), Kharbga.BoardMoveType.MovingToNotAjacentcell);
                this.boardEvents.invalidMoveEvent(eventData);
                return { status: Kharbga.PlayerMoveStatus.ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL, capturedPieces: 0 };
            }
            toCell.SetSameAs(fromCell);
            fromCell.Clear();
            var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.ID(), Kharbga.BoardMoveType.MovedToAValidCell);
            this.boardEvents.validMoveEvent(eventData);
            var capturedCount = this.ProcessCapturedPieces(fromCell, toCell);
            return { status: Kharbga.PlayerMoveStatus.OK, capturedPieces: capturedCount };
            ;
        };
        Board.prototype.ProcessCapturedPieces = function (fromCell, toCell) {
            var ret = 0;
            var toCellAdjacentCells = toCell.GetAdjacentCells();
            var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.ID(), Kharbga.BoardMoveType.MovedToAValidCell);
            for (var _i = 0, toCellAdjacentCells_1 = toCellAdjacentCells; _i < toCellAdjacentCells_1.length; _i++) {
                var adjCell = toCellAdjacentCells_1[_i];
                if (adjCell.IsEmpty())
                    continue;
                if (adjCell.State == toCell.State)
                    continue;
                if (toCell.Above() == adjCell) {
                    if (adjCell.Above() != null && adjCell.Above().State() == toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedCellEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Below() == adjCell) {
                    if (adjCell.Below() != null && adjCell.Below().State() == toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedCellEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Left() == adjCell) {
                    if (adjCell.Left() != null && adjCell.Left().State() == toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedCellEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Right() == adjCell) {
                    if (adjCell.Right() != null && adjCell.Right().State() == toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedCellEvent(eventData);
                        ret++;
                    }
                }
            }
            return ret;
        };
        Board.prototype.AllPiecesAreSet = function () {
            return this.piecesSetCount == 48;
        };
        Board.prototype.Clear = function () {
            this.piecesSetCount = 0;
            for (var id in Object.keys(this.cellsById)) {
                var cell = this.GetCellById(id);
                if (cell != null)
                    cell.Clear();
            }
        };
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
        Board.prototype.GetPossibleMoves = function (player) {
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
                            ret.push(new Kharbga.GameMove(fromCell.ID(), toCell.ID(), player));
                        }
                    }
                }
            }
            return ret;
        };
        Board.prototype.RaiseBoardInvalidMoveEvent = function (boardMoveType, from, to) {
            var eventData = new Kharbga.BoardEventData(from, to, to.ID(), boardMoveType);
            this.boardEvents.validMoveEvent(eventData);
        };
        Board.prototype.StillHavePiecesToCapture = function (fromCell) {
            var ret = false;
            var adjCells = fromCell.GetAdjacentCells();
            for (var _i = 0, adjCells_1 = adjCells; _i < adjCells_1.length; _i++) {
                var cell = adjCells_1[_i];
                if (!cell.IsEmpty)
                    continue;
                var toCell = cell;
                var toCellAjdCells = toCell.GetAdjacentCells();
                for (var _a = 0, toCellAjdCells_1 = toCellAjdCells; _a < toCellAjdCells_1.length; _a++) {
                    var adjCell = toCellAjdCells_1[_a];
                    if (adjCell.IsEmpty)
                        continue;
                    if (adjCell.State() == fromCell.State())
                        continue;
                    if (toCell.Above() == adjCell) {
                        if (adjCell.Above() != null && adjCell.Above().State() == fromCell.State()) {
                            return true;
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
        Board.prototype.RecordExchange = function (untouchablePieceId, attackerPiece1Id, attackerPiece2Id) {
            var uc = this.GetCellById(untouchablePieceId);
            var ac1 = this.GetCellById(attackerPiece1Id);
            var ac2 = this.GetCellById(attackerPiece2Id);
            uc.Clear();
            ac1.Clear();
            ac2.Clear();
        };
        return Board;
    }());
    Kharbga.Board = Board;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var BoardCell = (function () {
        function BoardCell(b, row, col) {
            this.state = Kharbga.BoardCellState.Empty;
            this.left = null;
            this.right = null;
            this.up = null;
            this.down = null;
            if (row < 0 || row > 6)
                alert("invalid board row: " + row);
            if (col < 0 || col > 6)
                alert("invalid board col: " + col);
            this.board = b;
            this.row = row;
            this.col = col;
            this.id = BoardCell.COLUMNS[col] + BoardCell.ROWS[row];
            this.listAdjacentCells = [];
        }
        BoardCell.prototype.Row = function () {
            return this.row;
        };
        BoardCell.prototype.Col = function () {
            return this.col;
        };
        BoardCell.prototype.ID = function () {
            return this.id;
        };
        BoardCell.prototype.Above = function () {
            return this.up;
        };
        BoardCell.prototype.Below = function () {
            return this.down;
        };
        BoardCell.prototype.Right = function () {
            return this.right;
        };
        BoardCell.prototype.Left = function () {
            return this.left;
        };
        BoardCell.prototype.State = function () {
            return this.state;
        };
        BoardCell.prototype.IsOccupied = function () {
            return this.state != Kharbga.BoardCellState.Empty;
        };
        BoardCell.prototype.IsOccupiedByAttacker = function () {
            return this.state == Kharbga.BoardCellState.OccupiedByAttacker;
        };
        BoardCell.prototype.IsOccupiedByDefender = function () {
            return this.state == Kharbga.BoardCellState.OccupiedByDefender;
        };
        BoardCell.prototype.IsMalha = function () {
            if (this.row == 3 && this.col == 3)
                return true;
            else
                return false;
        };
        BoardCell.prototype.SetPiece = function (playerIsAttacker) {
            if (playerIsAttacker)
                this.state = Kharbga.BoardCellState.OccupiedByAttacker;
            else
                this.state = Kharbga.BoardCellState.OccupiedByDefender;
        };
        BoardCell.prototype.SetSameAs = function (cell) {
            this.state = cell.state;
        };
        BoardCell.prototype.SetAdjacentCells = function (board) {
            if (board == null) {
                alert("board is null");
                return;
            }
            if (this.col - 1 >= 0) {
                this.left = board.GetCell(this.Row(), this.Col() - 1);
                if (this.left != null)
                    this.listAdjacentCells.push(this.left);
            }
            if (this.col + 1 <= 6) {
                this.right = board.GetCell(this.Row(), this.Col() + 1);
                if (this.right != null)
                    this.listAdjacentCells.push(this.right);
            }
            if (this.row - 1 >= 0) {
                this.up = board.GetCell(this.Row() - 1, this.Col());
                if (this.up != null)
                    this.listAdjacentCells.push(this.up);
            }
            if (this.row + 1 <= 6) {
                this.down = board.GetCell(this.Row() + 1, this.Col());
                if (this.down != null)
                    this.listAdjacentCells.push(this.down);
            }
        };
        BoardCell.prototype.GetAdjacentCells = function () {
            return this.listAdjacentCells;
        };
        BoardCell.prototype.IsAdjacentTo = function (cell) {
            this.listAdjacentCells.forEach(function (e) {
                if (e == cell)
                    return true;
            });
            return false;
        };
        BoardCell.prototype.Clear = function () {
            this.state = Kharbga.BoardCellState.Empty;
        };
        BoardCell.prototype.IsOccupiedBy = function (player) {
            switch (this.state) {
                case Kharbga.BoardCellState.Empty:
                    return false;
                case Kharbga.BoardCellState.OccupiedByAttacker:
                    return player.IsAttacker();
                case Kharbga.BoardCellState.OccupiedByDefender:
                    return player.IsDefender();
                default:
                    return false;
            }
        };
        BoardCell.prototype.IsEmpty = function () {
            return this.state == Kharbga.BoardCellState.Empty;
        };
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
            return this.state == Kharbga.BoardCellState.OccupiedByDefenderRequestingTwo;
        };
        return BoardCell;
    }());
    BoardCell.TopLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
    BoardCell.BottomLabels = ["A", "B", "C", "D", "E", "F", "G"];
    BoardCell.COLUMNS = 'abcdefg'.split('');
    BoardCell.ROWS = '1234567'.split('');
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
    var PlayerType;
    (function (PlayerType) {
        PlayerType[PlayerType["Person"] = 0] = "Person";
        PlayerType[PlayerType["Computer"] = 1] = "Computer";
    })(PlayerType = Kharbga.PlayerType || (Kharbga.PlayerType = {}));
    var PlayerRole;
    (function (PlayerRole) {
        PlayerRole[PlayerRole["Attacker"] = 0] = "Attacker";
        PlayerRole[PlayerRole["Defender"] = 1] = "Defender";
        PlayerRole[PlayerRole["Spectator"] = 2] = "Spectator";
    })(PlayerRole = Kharbga.PlayerRole || (Kharbga.PlayerRole = {}));
    var PlayerSettingStatus;
    (function (PlayerSettingStatus) {
        PlayerSettingStatus[PlayerSettingStatus["OK"] = 0] = "OK";
        PlayerSettingStatus[PlayerSettingStatus["ERR_INVALID_CELL"] = 1] = "ERR_INVALID_CELL";
        PlayerSettingStatus[PlayerSettingStatus["ERR_MALHA"] = 2] = "ERR_MALHA";
        PlayerSettingStatus[PlayerSettingStatus["ERR_OCCUPIED"] = 3] = "ERR_OCCUPIED";
    })(PlayerSettingStatus = Kharbga.PlayerSettingStatus || (Kharbga.PlayerSettingStatus = {}));
    var PlayerMoveStatus;
    (function (PlayerMoveStatus) {
        PlayerMoveStatus[PlayerMoveStatus["OK"] = 0] = "OK";
        PlayerMoveStatus[PlayerMoveStatus["ERR_FROM_IS_SURROUNDED"] = 1] = "ERR_FROM_IS_SURROUNDED";
        PlayerMoveStatus[PlayerMoveStatus["ERR_TO_IS_OCCUPIED"] = 2] = "ERR_TO_IS_OCCUPIED";
        PlayerMoveStatus[PlayerMoveStatus["ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL"] = 3] = "ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL";
    })(PlayerMoveStatus = Kharbga.PlayerMoveStatus || (Kharbga.PlayerMoveStatus = {}));
    var BoardCellState;
    (function (BoardCellState) {
        BoardCellState[BoardCellState["Empty"] = 0] = "Empty";
        BoardCellState[BoardCellState["OccupiedByAttacker"] = 1] = "OccupiedByAttacker";
        BoardCellState[BoardCellState["OccupiedByDefender"] = 2] = "OccupiedByDefender";
        BoardCellState[BoardCellState["OccupiedByDefenderRequestingTwo"] = 3] = "OccupiedByDefenderRequestingTwo";
    })(BoardCellState = Kharbga.BoardCellState || (Kharbga.BoardCellState = {}));
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
    })(BoardMoveType = Kharbga.BoardMoveType || (Kharbga.BoardMoveType = {}));
    ;
    var PieceState;
    (function (PieceState) {
        PieceState[PieceState["IsNotSetYet"] = 0] = "IsNotSetYet";
        PieceState[PieceState["IsOnBoard"] = 1] = "IsOnBoard";
        PieceState[PieceState["IsOnBoardUntouchable"] = 2] = "IsOnBoardUntouchable";
        PieceState[PieceState["IsCapturedOnBoard"] = 3] = "IsCapturedOnBoard";
        PieceState[PieceState["IsCapturedOffBoard"] = 4] = "IsCapturedOffBoard";
        PieceState[PieceState["IsExchanged"] = 5] = "IsExchanged";
    })(PieceState = Kharbga.PieceState || (Kharbga.PieceState = {}));
    var GameState;
    (function (GameState) {
        GameState[GameState["NotStarted"] = 0] = "NotStarted";
        GameState[GameState["Setting"] = 1] = "Setting";
        GameState[GameState["DefenderCanNotMove"] = 2] = "DefenderCanNotMove";
        GameState[GameState["AttackerCanNotMove"] = 3] = "AttackerCanNotMove";
        GameState[GameState["Moving"] = 4] = "Moving";
        GameState[GameState["DefenderMovingUntouchable"] = 5] = "DefenderMovingUntouchable";
        GameState[GameState["AttackerAbondoned"] = 6] = "AttackerAbondoned";
        GameState[GameState["DefenderAbondoned"] = 7] = "DefenderAbondoned";
        GameState[GameState["DefenderLostAllPieces"] = 8] = "DefenderLostAllPieces";
        GameState[GameState["WinnerDeclared"] = 9] = "WinnerDeclared";
    })(GameState = Kharbga.GameState || (Kharbga.GameState = {}));
    var GameActionType;
    (function (GameActionType) {
        GameActionType[GameActionType["Setting"] = 0] = "Setting";
        GameActionType[GameActionType["Move"] = 1] = "Move";
        GameActionType[GameActionType["MoveCapture"] = 2] = "MoveCapture";
        GameActionType[GameActionType["DefenderRequestTwo"] = 3] = "DefenderRequestTwo";
        GameActionType[GameActionType["DefenderRequestTwoAccepptedByAttacker"] = 4] = "DefenderRequestTwoAccepptedByAttacker";
    })(GameActionType = Kharbga.GameActionType || (Kharbga.GameActionType = {}));
    var Player = (function () {
        function Player(role) {
            this.occupiedCells = new Array(24);
            this.type = PlayerType.Person;
            this.role = role;
        }
        Player.prototype.IsAttacker = function () { return this.role == PlayerRole.Attacker; };
        Player.prototype.IsDefender = function () { return this.role == PlayerRole.Defender; };
        Player.prototype.Type = function () { return this.type; };
        Player.prototype.Role = function () { return this.role; };
        Player.prototype.Reset = function () {
            this.toalTimeThinkingSinceStartOfGame = 0;
        };
        return Player;
    }());
    Kharbga.Player = Player;
    var Attacker = (function (_super) {
        __extends(Attacker, _super);
        function Attacker() {
            return _super.call(this, PlayerRole.Attacker) || this;
        }
        return Attacker;
    }(Player));
    Kharbga.Attacker = Attacker;
    var Defender = (function (_super) {
        __extends(Defender, _super);
        function Defender() {
            return _super.call(this, PlayerRole.Defender) || this;
        }
        return Defender;
    }(Player));
    Kharbga.Defender = Defender;
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
    Kharbga.Piece = Piece;
    var GameMove = (function () {
        function GameMove(from, to, p) {
            this.From = from;
            this.To = to;
            this.Player = p;
        }
        return GameMove;
    }());
    Kharbga.GameMove = GameMove;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var Game = (function () {
        function Game(gameEvents, boardEvents) {
            this.attacker = new Kharbga.Attacker();
            this.defender = new Kharbga.Defender();
            this.spectators = new Array(2);
            this.history = new Kharbga.GameHistory();
            this.numberOfSettingsAllowed = 2;
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.fromCell = null;
            this.defenderUntouchableMove = null;
            this.attackerUntouchable1 = null;
            this.attackerUntouchable2 = null;
            this.state = Kharbga.GameState.NotStarted;
            this.gameEvents = gameEvents;
            this.boardEvents = boardEvents;
            this.board = new Kharbga.Board(boardEvents);
        }
        Game.prototype.init = function () {
            this.id = "";
            this.startTime = new Date();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.currentPlayer = this.attacker;
            this.state = Kharbga.GameState.Setting;
        };
        Game.prototype.moves = function () {
            var ret = this.board.GetPossibleMoves(this.currentPlayer);
            return ret;
        };
        Game.prototype.fen = function () {
            return this.board.fen();
        };
        Game.prototype.isInSettingMode = function () {
            return this.state == Kharbga.GameState.Setting;
        };
        Game.prototype.getGameId = function () {
            return this.id;
        };
        Game.prototype.setGameId = function (id) {
            this.id = id;
        };
        Game.prototype.getState = function () { return this.state; };
        Game.prototype.start = function () {
            this.init();
            this.reset();
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newGameStartedEvent(eventData);
            this.gameEvents.newPlayerTurnEvent(eventData);
        };
        Game.prototype.game_over = function () {
            if (this.state == Kharbga.GameState.WinnerDeclared)
                return true;
            else
                return false;
        };
        Game.prototype.game_setting_over = function () {
            if (this.state === Kharbga.GameState.Setting)
                return false;
            else
                return true;
        };
        Game.prototype.turn = function () {
            if (this.currentPlayer.IsAttacker())
                return 'a';
            else
                return 'd';
        };
        Game.prototype.getHistory = function () { return this.history; };
        Game.prototype.getCurrentPlayer = function () { return this.currentPlayer; };
        Game.prototype.getAttackerScore = function () { return this.attackerScore; };
        Game.prototype.getDefenderScore = function () { return this.defenderScore; };
        Game.prototype.getStartTime = function () { return this.startTime; };
        Game.prototype.getWinner = function () { return this.winner; };
        Game.prototype.getAttacker = function () { return this.attacker; };
        Game.prototype.getDefender = function () { return this.defender; };
        Game.prototype.addSpectator = function (s) {
            this.spectators.push(s);
        };
        Game.prototype.Board = function () { return this.board; };
        Game.prototype.reset = function () {
            this.board.Clear();
            this.attacker.Reset();
            this.defender.Reset();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.winner = null;
        };
        Game.prototype.processSetting = function (cellId) {
            if (this.state == Kharbga.GameState.Setting)
                return this.recordSetting(cellId);
            else
                return false;
        };
        Game.prototype.processMove = function (fromCellId, toCellId) {
            if (this.state != Kharbga.GameState.Moving)
                return false;
            var ret = false;
            var fromCell = this.board.GetCellById(fromCellId);
            if (fromCell == null)
                return ret;
            if (fromCell.IsOccupiedBy(this.getCurrentPlayer()) === false) {
                return ret;
            }
            if (fromCell.IsSurrounded()) {
                return ret;
            }
            var toCell = this.board.GetCellById(toCellId);
            ;
            if (fromCell === toCell) {
                this.fromCell = null;
                return ret;
            }
            var result = this.board.RecordPlayerMove(fromCell, toCell);
            if (result.status == Kharbga.PlayerMoveStatus.OK) {
                var move = new Kharbga.GameMove(this.fromCell.ID(), toCell.ID(), this.currentPlayer);
                this.history.AddMove(this.currentPlayer, fromCell.ID(), toCell.ID());
                this.fromCell = null;
                ret = true;
            }
            if (result.capturedPieces == 0) {
                this.PlayerChangeTurn();
            }
            else {
                if (this.currentPlayer.IsAttacker()) {
                    this.defenderScore -= result.capturedPieces;
                }
                else
                    this.attackerScore -= result.capturedPieces;
                if (!this.board.StillHavePiecesToCapture(toCell))
                    this.PlayerChangeTurn();
                this.CheckScores();
            }
            return ret;
        };
        Game.prototype.checkIfSettingsCompleted = function () {
            if (this.board.AllPiecesAreSet()) {
                this.state = Kharbga.GameState.Moving;
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);
            }
        };
        Game.prototype.checkIfPlayerCanNotMove = function () {
            this.PlayerChangeTurn();
        };
        Game.prototype.PlayerChangeTurn = function () {
            if (this.currentPlayer.IsAttacker())
                this.currentPlayer = this.defender;
            else
                this.currentPlayer = this.attacker;
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newPlayerTurnEvent(eventData);
        };
        Game.prototype.CurrentPlayerAbdondoned = function () {
            if (this.currentPlayer == this.attacker) {
                this.state = Kharbga.GameState.AttackerAbondoned;
                this.winner = this.defender;
            }
            else {
                this.state = Kharbga.GameState.DefenderAbondoned;
                this.winner = this.attacker;
            }
            var eventData = new Kharbga.GameEventData(this, this.winner);
            this.gameEvents.winnerDeclaredEvent(eventData);
        };
        Game.prototype.CheckScores = function () {
            if (this.defenderScore == 0) {
                this.winner = this.attacker;
                this.state = Kharbga.GameState.DefenderLostAllPieces;
                var eventData = new Kharbga.GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            }
        };
        Game.prototype.CurrentPlayerPassed = function () {
            var bCanPass = this.CheckIfCurrentPlayerCanPassTurn();
            if (bCanPass) {
                if (this.currentPlayer.IsAttacker) {
                    this.currentPlayer = this.defender;
                }
                else {
                    this.currentPlayer = this.attacker;
                }
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.newPlayerTurnEvent(eventData);
            }
            return bCanPass;
        };
        Game.prototype.CheckIfCurrentPlayerCanPassTurn = function () {
            var possibleMoves = this.board.GetPossibleMoves(this.currentPlayer);
            if (possibleMoves.length == 0)
                return true;
            else
                return false;
        };
        Game.prototype.recordSetting = function (cellId) {
            if (this.state != Kharbga.GameState.Setting)
                return false;
            var recorded = this.board.RecordPlayerSetting(cellId, this.getCurrentPlayer().IsAttacker());
            if (recorded == Kharbga.PlayerSettingStatus.OK) {
                var cell = this.board.GetCellById(cellId);
                this.numberOfSettingsAllowed--;
                this.history.AddSetting(this.currentPlayer, cell.ID());
                if (this.getCurrentPlayer().IsAttacker() === true)
                    this.attackerScore++;
                else
                    this.defenderScore++;
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                eventData.from = cell;
                eventData.to = cell;
                this.gameEvents.newSettingCompletedEvent(eventData);
                if (this.numberOfSettingsAllowed == 0) {
                    this.numberOfSettingsAllowed = 2;
                    this.PlayerChangeTurn();
                }
                this.checkIfSettingsCompleted();
            }
            else {
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                var cell = this.board.GetCellById(cellId);
                eventData.targetCellId = cellId;
                eventData.from = cell;
                eventData.to = cell;
                if (recorded === Kharbga.PlayerSettingStatus.ERR_MALHA)
                    this.gameEvents.invalidSettingMalhaEvent(eventData);
                else if (recorded === Kharbga.PlayerSettingStatus.ERR_OCCUPIED)
                    this.gameEvents.invalidSettingOccupiedEvent(eventData);
            }
            return recorded == Kharbga.PlayerSettingStatus.OK;
        };
        Game.prototype.is_in_moving_state = function () {
            return this.state == Kharbga.GameState.Moving;
        };
        Game.prototype.is_surrounded_piece = function (selectedPieceId) {
            var clickedCell = this.board.GetCellById(selectedPieceId);
            return clickedCell.IsSurrounded();
        };
        Game.prototype.recordMove = function (clickedCellId) {
            if (this.state != Kharbga.GameState.Moving)
                return false;
            var ret = false;
            var clickedCell = this.board.GetCellById(clickedCellId);
            var toCell;
            if (this.fromCell == null) {
                if (!clickedCell.IsOccupiedBy(this.getCurrentPlayer())) {
                    this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, clickedCell, null);
                    return ret;
                }
                if (clickedCell.IsSurrounded()) {
                    this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.SelectedCellThatIsSourroundedForMoving, clickedCell, null);
                    return ret;
                }
                this.fromCell = clickedCell;
            }
            else {
                toCell = clickedCell;
                if (this.fromCell == toCell) {
                    this.fromCell = null;
                    return true;
                }
                var result = this.board.RecordPlayerMove(this.fromCell, toCell);
                if (result.status == Kharbga.PlayerMoveStatus.OK) {
                    var move = new Kharbga.GameMove(this.fromCell.ID(), toCell.ID(), this.currentPlayer);
                    this.history.AddMove(this.currentPlayer, this.fromCell.ID(), toCell.ID());
                    this.fromCell = null;
                    ret = true;
                }
                if (result.capturedPieces == 0) {
                    this.PlayerChangeTurn();
                }
                else {
                    if (this.currentPlayer.IsAttacker()) {
                        this.defenderScore -= result.capturedPieces;
                    }
                    else
                        this.attackerScore -= result.capturedPieces;
                    if (!this.board.StillHavePiecesToCapture(toCell))
                        this.PlayerChangeTurn();
                    this.CheckScores();
                }
            }
            return ret;
        };
        Game.prototype.CheckUntouchableMoves = function (move) {
            if (this.defenderIsRequestingExchange == true) {
                if (this.currentPlayer.IsDefender()) {
                    this.defenderUntouchableMove = move;
                }
                if (this.currentPlayer.IsAttacker() && this.defenderUntouchableMove != null) {
                    if (this.attackerUntouchable1 == null) {
                        this.attackerUntouchable1 = move;
                    }
                    else if (this.attackerUntouchable2 == null) {
                        this.attackerUntouchable2 = move;
                        this.ProcessUntouchableTwoExchange(this.defenderUntouchableMove.To, this.attackerUntouchable1.To, this.attackerUntouchable2.To);
                    }
                }
            }
            else {
                this.defenderUntouchableMove = null;
                this.attackerUntouchable1 = null;
                this.attackerUntouchable2 = null;
            }
        };
        Game.prototype.SetRequestingExchangeState = function (requestingExchange) {
            this.defenderIsRequestingExchange = requestingExchange;
            if (requestingExchange != true) {
                this.defenderUntouchableMove = null;
                this.attackerUntouchable1 = null;
                this.attackerUntouchable2 = null;
            }
        };
        Game.prototype.ProcessUntouchableTwoExchange = function (untouchablePieceId, attackerPiece1, attackerPiece2) {
            this.board.RecordExchange(untouchablePieceId, attackerPiece1, attackerPiece2);
            this.defenderScore--;
            this.attackerScore--;
            this.attackerScore--;
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
        }
        return GameEventData;
    }());
    Kharbga.GameEventData = GameEventData;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var GameHistory = (function () {
        function GameHistory() {
            this.settings = [];
            this.moves = [];
        }
        GameHistory.prototype.AddSetting = function (player, settingCellId) {
            var move = player.IsAttacker ? 'A' : 'D' + ":" + settingCellId;
            this.settings.push(move);
        };
        GameHistory.prototype.AddMove = function (player, fromCellId, toCellId) {
            var move = player.IsAttacker ? 'A' : 'D' + ":" + fromCellId + "-" + toCellId;
            this.moves.push(move);
        };
        return GameHistory;
    }());
    Kharbga.GameHistory = GameHistory;
})(Kharbga || (Kharbga = {}));
//# sourceMappingURL=kharbga.js.map