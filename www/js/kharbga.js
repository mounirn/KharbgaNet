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
                    this.cellsById[cell.id] = cell;
                }
            }
            this._cellIds = Object.keys(this.cellsById);
            for (var _i = 0, _a = this._cellIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var cell = this.cellsById[id];
                cell.setAdjacentCells(this);
            }
        }
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
            ret = ret.replace(/1111111/g, "7");
            ret = ret.replace(/111111/g, "6");
            ret = ret.replace(/11111/g, "5");
            ret = ret.replace(/1111/g, "4");
            ret = ret.replace(/111/g, "3");
            ret = ret.replace(/11/g, "2");
            return ret;
        };
        Board.prototype.getCell = function (row, col) {
            return this.cells[row][col];
        };
        Board.prototype.getCellById = function (id) {
            return this.cellsById[id];
        };
        Board.prototype.isOccupiedByAttacker = function (id) {
            var cell = this.getCellById(id);
            if (cell == null) {
                return false;
            }
            return cell.isOccupiedByAttacker();
        };
        Board.prototype.isOccupiedByDefender = function (id) {
            var cell = this.getCellById(id);
            if (cell == null) {
                return false;
            }
            return cell.isOccupiedByDefender();
        };
        Board.prototype.recordPlayerSetting = function (id, isAttacker) {
            var cell = this.getCellById(id);
            if (cell == null) {
                console.log("invalid cell id passed: %s", id);
                return Kharbga.PlayerSettingStatus.ERR_INVALID_CELL;
            }
            var eventData;
            if (cell.isMalha() === true) {
                if (this.boardEvents != null) {
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
        Board.prototype.RecordPlayerMove = function (fromCell, toCell) {
            if (fromCell.isSurrounded() === true) {
                if (this.boardEvents != null) {
                    var eventData = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.SelectedCellThatIsSurroundedForMoving);
                    this.boardEvents.invalidMoveEvent(eventData);
                }
                return { status: Kharbga.PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
            }
            if (toCell.isOccupied() === true) {
                if (this.boardEvents != null) {
                    var eventData2 = new Kharbga.BoardEventData(fromCell, toCell, toCell.id, Kharbga.BoardMoveType.MovingToAnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData2);
                }
                return { status: Kharbga.PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
            }
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
            var capturedCount = this.ProcessCapturedPieces(fromCell, toCell);
            return { status: Kharbga.PlayerMoveStatus.OK, capturedPieces: capturedCount };
        };
        Board.prototype.ProcessCapturedPieces = function (fromCell, toCell) {
            var ret = 0;
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
                if (toCell.Above() === adjCell) {
                    if (adjCell.Above() != null && adjCell.Above().State() === toCell.State()) {
                        adjCell.clear();
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
        Board.prototype.allPiecesAreSet = function () {
            return this.piecesSetCount === 48;
        };
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
        Board.prototype.getPossibleMoves = function (player, fromId) {
            if (fromId === void 0) { fromId = ""; }
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
                if (fromId === cellId) {
                    break;
                }
            }
            return ret;
        };
        Board.prototype.GetPossibleUnreachableMoves = function (player, fromId) {
            if (fromId === void 0) { fromId = ""; }
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
                if (fromId === cellId) {
                    break;
                }
            }
            return ret;
        };
        Board.prototype.RaiseBoardInvalidMoveEvent = function (boardMoveType, from, to, invalidCellId) {
            if (this.boardEvents != null) {
                var eventData = new Kharbga.BoardEventData(from, to, invalidCellId, boardMoveType);
                this.boardEvents.invalidMoveEvent(eventData);
            }
        };
        Board.prototype.StillHavePiecesToCapture = function (fromCell) {
            var moves = new Array();
            var ret = { status: false, possibleMoves: moves };
            var adjCells = fromCell.getAdjacentCells();
            for (var _i = 0, adjCells_1 = adjCells; _i < adjCells_1.length; _i++) {
                var cell = adjCells_1[_i];
                if (cell.isEmpty() === false) {
                    continue;
                }
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
        Board.prototype.hasCapturablePieces = function (player, opponent) {
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
                if (cell.Left() != null && cell.Left().isEmpty()) {
                    if (cell.Right() != null && cell.Right().isOccupiedBy(opponent) === false) {
                        if (cell.Left().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                            ret.status = true;
                        }
                    }
                }
                if (cell.Right() != null && cell.Right().isEmpty()) {
                    if (cell.Left() != null && cell.Left().isOccupiedBy(opponent) === false) {
                        if (cell.Right().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }
                if (cell.Above() != null && cell.Above().isEmpty()) {
                    if (cell.Below() != null && cell.Below().isOccupiedBy(opponent) === false) {
                        if (cell.Above().anyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }
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
        Board.prototype.isCapturable = function (player, cellId) {
            var cell = this.getCellById(cellId);
            if (cell == null) {
                console.log("IsCapturable - Invalid cell Id : %s", cellId);
                return false;
            }
            return cell.isCapturable(player);
        };
        Board.prototype.recordExchange = function (untouchablePieceId, attackerPiece1Id, attackerPiece2Id) {
            var uc = this.getCellById(untouchablePieceId);
            if (uc == null) {
                return false;
            }
            var ac1 = this.getCellById(attackerPiece1Id);
            if (ac1 == null) {
                return false;
            }
            var ac2 = this.getCellById(attackerPiece2Id);
            if (ac2 == null) {
                return false;
            }
            if (ac1 === ac2) {
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
    var BoardCell = (function () {
        function BoardCell(b, row, col) {
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
        BoardCell.prototype.isOccupied = function () {
            return this.state !== Kharbga.BoardCellState.Empty;
        };
        BoardCell.prototype.isOccupiedByAttacker = function () {
            return this.state === Kharbga.BoardCellState.OccupiedByAttacker;
        };
        BoardCell.prototype.isOccupiedByDefender = function () {
            return this.state === Kharbga.BoardCellState.OccupiedByDefender;
        };
        BoardCell.prototype.isMalha = function () {
            if (this.row === 3 && this.col === 3) {
                return true;
            }
            else {
                return false;
            }
        };
        BoardCell.prototype.setPiece = function (playerIsAttacker) {
            if (playerIsAttacker) {
                this.state = Kharbga.BoardCellState.OccupiedByAttacker;
            }
            else {
                this.state = Kharbga.BoardCellState.OccupiedByDefender;
            }
        };
        BoardCell.prototype.setSameAs = function (cell) {
            this.state = cell.state;
        };
        BoardCell.prototype.setAdjacentCells = function (board) {
            if (board == null) {
                alert("board is null");
                return;
            }
            this.board = board;
            if (this.col - 1 >= 0) {
                this.left = board.getCell(this.row, this.col - 1);
                if (this.left != null) {
                    this.listAdjacentCells.push(this.left);
                }
            }
            if (this.col + 1 <= 6) {
                this.right = board.getCell(this.row, this.col + 1);
                if (this.right != null) {
                    this.listAdjacentCells.push(this.right);
                }
            }
            if (this.row - 1 >= 0) {
                this.up = board.getCell(this.row - 1, this.col);
                if (this.up != null) {
                    this.listAdjacentCells.push(this.up);
                }
            }
            if (this.row + 1 <= 6) {
                this.down = board.getCell(this.row + 1, this.col);
                if (this.down != null) {
                    this.listAdjacentCells.push(this.down);
                }
            }
        };
        BoardCell.prototype.getAdjacentCells = function () {
            return this.listAdjacentCells;
        };
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
        BoardCell.prototype.clear = function () {
            this.state = Kharbga.BoardCellState.Empty;
        };
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
        BoardCell.prototype.isEmpty = function () {
            return this.state === Kharbga.BoardCellState.Empty;
        };
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
        BoardCell.prototype.isDefenderRequestingTwo = function () {
            return this.state === Kharbga.BoardCellState.OccupiedByDefenderRequestingTwo;
        };
        BoardCell.prototype.isReachable = function (player) {
            var reachableFromUp = false;
            var ownPlayerFoundUp = false;
            var reachableFromRight = false;
            var ownPlayerFoundRight = false;
            var reachableFromLeft = false;
            var ownPlayerFoundLeft = false;
            var reachableFromBelow = false;
            var ownPlayerFoundBelow = false;
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
        BoardCell.prototype.isCapturable = function (player) {
            if (!this.isOccupiedBy(player)) {
                return false;
            }
            if (this.Above() != null && this.Above().isEmpty() &&
                this.Below() != null && this.Below().isOccupiedByOpponent(player)) {
                if (this.Above().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            if (this.Below() != null && this.Below().isEmpty() &&
                this.Above() != null && this.Above().isOccupiedByOpponent(player)) {
                if (this.Below().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            if (this.Left() != null && this.Left().isEmpty() && this.Right() != null &&
                this.Right().isOccupiedByOpponent(player)) {
                if (this.Left().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
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
        PlayerMoveStatus[PlayerMoveStatus["ERR_INVALID"] = 4] = "ERR_INVALID";
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
        GameState[GameState["Started"] = 1] = "Started";
        GameState[GameState["Pending"] = 2] = "Pending";
        GameState[GameState["Setting"] = 3] = "Setting";
        GameState[GameState["DefenderCanNotMove"] = 4] = "DefenderCanNotMove";
        GameState[GameState["AttackerCanNotMove"] = 5] = "AttackerCanNotMove";
        GameState[GameState["Moving"] = 6] = "Moving";
        GameState[GameState["DefenderMovingUntouchable"] = 7] = "DefenderMovingUntouchable";
        GameState[GameState["AttackerAbandoned"] = 8] = "AttackerAbandoned";
        GameState[GameState["DefenderAbandoned"] = 9] = "DefenderAbandoned";
        GameState[GameState["DefenderLostAllPieces"] = 10] = "DefenderLostAllPieces";
        GameState[GameState["AttackerLostAllPieces"] = 11] = "AttackerLostAllPieces";
        GameState[GameState["WinnerDeclared"] = 12] = "WinnerDeclared";
        GameState[GameState["WinnerDeclaredDefenderIsBlocked"] = 13] = "WinnerDeclaredDefenderIsBlocked";
    })(GameState = Kharbga.GameState || (Kharbga.GameState = {}));
    var GameStatus;
    (function (GameStatus) {
        GameStatus[GameStatus["Created"] = 0] = "Created";
        GameStatus[GameStatus["Joined"] = 1] = "Joined";
        GameStatus[GameStatus["Active"] = 2] = "Active";
        GameStatus[GameStatus["Completed"] = 3] = "Completed";
        GameStatus[GameStatus["Aborted"] = 4] = "Aborted";
        GameStatus[GameStatus["Disconnected"] = 5] = "Disconnected";
    })(GameStatus = Kharbga.GameStatus || (Kharbga.GameStatus = {}));
    var GameActionType;
    (function (GameActionType) {
        GameActionType[GameActionType["Setting"] = 0] = "Setting";
        GameActionType[GameActionType["Move"] = 1] = "Move";
        GameActionType[GameActionType["MoveCapture"] = 2] = "MoveCapture";
        GameActionType[GameActionType["DefenderRequestTwo"] = 3] = "DefenderRequestTwo";
        GameActionType[GameActionType["DefenderRequestTwoAcceptedByAttacker"] = 4] = "DefenderRequestTwoAcceptedByAttacker";
    })(GameActionType = Kharbga.GameActionType || (Kharbga.GameActionType = {}));
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
    var Game = (function () {
        function Game(gameEvents, boardEvents) {
            this.attacker = new Kharbga.Attacker();
            this.defender = new Kharbga.Defender();
            this.spectators = new Array(2);
            this.history = new Kharbga.GameHistory();
            this.numberOfSettingsAllowed = 2;
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.attackerMove = 0;
            this.defenderMove = 0;
            this.moveSourceRequiredAfterCapture = "";
            this.moveDestinationsPossibleCapture = null;
            this.firstMove = true;
            this.state = Kharbga.GameState.NotStarted;
            this.gameEvents = gameEvents;
            this.boardEvents = boardEvents;
            this.board = new Kharbga.Board(boardEvents);
            this.moveFlags = new Kharbga.GameMoveFlags();
        }
        Game.prototype.init = function () {
            this.id = "";
            this.startTime = new Date();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.attackerMove = 0;
            this.defenderMove = 0;
            this.currentPlayer = this.attacker;
            this.state = Kharbga.GameState.Setting;
            this.firstMove = true;
            this.reset();
        };
        Game.prototype.start = function () {
            this.init();
            this.reset();
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newGameStartedEvent(eventData);
            this.gameEvents.newPlayerTurnEvent(eventData);
        };
        Game.prototype.reset = function () {
            this.board.clear();
            this.attacker.reset();
            this.defender.reset();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.winner = null;
            this.currentPlayer = this.attacker;
            this.history.reset();
        };
        Game.prototype.moves = function (from) {
            if (from === void 0) { from = ""; }
            return this.board.getPossibleMoves(this.currentPlayer, from);
        };
        Game.prototype.moves_that_capture = function (from) {
            if (from === void 0) { from = ""; }
            var temp = this.board.getPossibleMoves(this.currentPlayer, from);
            var ret = new Array();
            for (var _i = 0, temp_1 = temp; _i < temp_1.length; _i++) {
                var move = temp_1[_i];
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
        Game.prototype.moves_that_save = function (from) {
            if (from === void 0) { from = ""; }
            var result = this.board.hasCapturablePieces(this.currentPlayer, this.currentPlayer.isAttacker ? this.defender : this.attacker);
            var tempMoves = this.board.getPossibleMoves(this.currentPlayer, from);
            var ret = new Array();
            for (var _i = 0, tempMoves_1 = tempMoves; _i < tempMoves_1.length; _i++) {
                var move = tempMoves_1[_i];
                var tempBoard = this.board.clone();
                var fromCell = tempBoard.getCellById(move.from);
                var toCell = tempBoard.getCellById(move.to);
                var moveResult = tempBoard.RecordPlayerMove(fromCell, toCell);
                var result2 = tempBoard.hasCapturablePieces(this.currentPlayer, this.currentPlayer.isAttacker ? this.defender : this.attacker);
                if (result2.capturables.length < result.capturables.length) {
                    ret.push(move);
                }
            }
            if (ret.length === 0) {
                ret = tempMoves;
            }
            return ret;
        };
        Game.prototype.moves_unreachables = function (from) {
            if (from === void 0) { from = ""; }
            return this.board.GetPossibleUnreachableMoves(this.currentPlayer, from);
        };
        Game.prototype.settings = function () {
            if (this.is_in_setting_state() === true) {
                return this.board.getPossibleSettings();
            }
            else {
                return [];
            }
        };
        Game.prototype.setPlayerNames = function (attacker, defender) {
            this.attacker.name = attacker;
            this.defender.name = defender;
        };
        Game.prototype.settings_near_malha = function () {
            var ret = new Array();
            var nearMalha = ["c4", "e4", "d3", "d5"];
            for (var i = 0; i < nearMalha.length; i++) {
                var cell = this.board.getCellById(nearMalha[i]);
                if (cell.isEmpty()) {
                    ret.push(nearMalha[i]);
                }
            }
            return ret;
        };
        Game.prototype.settings_near_opponent = function () {
            return this.board.getPossibleSettingsNearOpponent(this.currentPlayer);
        };
        Game.prototype.is_current_player_setting = function () {
            if (this.state !== Kharbga.GameState.Setting) {
                return false;
            }
            return this.numberOfSettingsAllowed > 0;
        };
        Game.prototype.fen = function () {
            return this.board.fen();
        };
        Game.prototype.set = function (fen) {
            if (this.validFen(fen) !== true) {
                return false;
            }
            fen = fen.replace(/ .+$/, "");
            var rows = fen.split("/");
            var position = {};
            var currentRow = 7;
            for (var i = 0; i < 7; i++) {
                var row = rows[i].split("");
                var colIndex = 0;
                for (var j = 0; j < row.length; j++) {
                    if (row[j].search(/[1-7]/) !== -1) {
                        var emptySquares = parseInt(row[j], 10);
                        colIndex += emptySquares;
                    }
                    else {
                        var square = Kharbga.BoardCell.COLUMNS[colIndex] + currentRow;
                        var isAttackerPiece = this.isDefenderPiece(row[j]) === false;
                        var result = this.board.recordPlayerSetting(square, isAttackerPiece);
                        if (result !== Kharbga.PlayerSettingStatus.OK) {
                            console.log("Error loading fen: " + fen + " at square: " + square);
                            return false;
                        }
                        else {
                            if (isAttackerPiece) {
                                this.attackerScore++;
                            }
                            else {
                                this.defenderScore++;
                            }
                        }
                        colIndex++;
                    }
                }
                currentRow--;
            }
            this.checkIfSettingsCompleted();
            return true;
        };
        Game.prototype.move_flags = function () {
            return this.moveFlags;
        };
        Game.prototype.isDefenderPiece = function (piece) {
            if (piece.toLowerCase() === piece) {
                return true;
            }
            else {
                return false;
            }
        };
        Game.prototype.validFen = function (fen) {
            if (typeof fen !== "string") {
                return false;
            }
            fen = fen.replace(/ .+$/, "");
            var chunks = fen.split("/");
            if (chunks.length !== 7) {
                return false;
            }
            for (var i = 0; i < 7; i++) {
                if (chunks[i] === "" ||
                    chunks[i].length > 7 ||
                    chunks[i].search(/[^sS1-7]/) !== -1) {
                    return false;
                }
            }
            return true;
        };
        Game.prototype.isInSettingMode = function () {
            return this.state === Kharbga.GameState.Setting;
        };
        Game.prototype.getGameId = function () {
            return this.id;
        };
        Game.prototype.setGameId = function (id) {
            this.id = id;
        };
        Game.prototype.setupWith = function (serverGameState, delayAfterEachMove) {
            if (delayAfterEachMove === void 0) { delayAfterEachMove = 0; }
            var ret = false;
            this.init();
            if (serverGameState.status === Kharbga.GameStatus.Joined) {
                this.state = Kharbga.GameState.Setting;
            }
            var sortedMoves = serverGameState.moves.sort(function (a, b) {
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
                    this.processSetting(move.to);
                }
            }
            for (var _a = 0, sortedMoves_2 = sortedMoves; _a < sortedMoves_2.length; _a++) {
                var move = sortedMoves_2[_a];
                if (!move.isSetting) {
                    this.processMove(move.from, move.to, move.resigned, move.exchangeRequest);
                }
            }
            return ret;
        };
        Game.prototype.getState = function () { return this.state; };
        Game.prototype.game_over = function () {
            if (this.state === Kharbga.GameState.Pending || this.state === Kharbga.GameState.Setting || this.state === Kharbga.GameState.Moving) {
                return false;
            }
            else {
                return true;
            }
        };
        Game.prototype.game_setting_over = function () {
            if (this.state === Kharbga.GameState.Setting) {
                return false;
            }
            else {
                return true;
            }
        };
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
        Game.prototype.is_empty = function (cellId) {
            var cell = this.board.getCellById(cellId);
            if (cell === null) {
                return false;
            }
            else {
                return cell.isEmpty();
            }
        };
        Game.prototype.is_valid = function (cellId) {
            var cell = this.board.getCellById(cellId);
            if (cell === null) {
                return false;
            }
            else {
                return true;
            }
        };
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
        Game.prototype.is_occupied_current_player = function (cellId) {
            var cell = this.board.getCellById(cellId);
            if (cell !== null) {
                return cell.isOccupiedBy(this.currentPlayer);
            }
            else {
                return false;
            }
        };
        Game.prototype.check = function () {
            this.checkPass();
            this.CheckScores();
        };
        Game.prototype.move_source_required = function () {
            return this.moveSourceRequiredAfterCapture;
        };
        Game.prototype.checkMoveSourceRequiredAndValidDestinations = function (dest) {
            if (this.moveDestinationsPossibleCapture == null || this.moveSourceRequiredAfterCapture == null ||
                this.moveSourceRequiredAfterCapture.length === 0) {
                return true;
            }
            if (this.moveDestinationsPossibleCapture.indexOf(dest) >= 0) {
                return true;
            }
            return false;
        };
        Game.prototype.getHistory = function () { return this.history; };
        Game.prototype.getCurrentPlayer = function () { return this.currentPlayer; };
        Game.prototype.getAttackerScore = function () { return this.attackerScore; };
        Game.prototype.getDefenderScore = function () { return this.defenderScore; };
        Game.prototype.getAttackerMoveNumber = function () { return this.attackerMove; };
        Game.prototype.getDefenderMoveNumber = function () { return this.defenderMove; };
        Game.prototype.getStartTime = function () { return this.startTime; };
        Game.prototype.getWinner = function () { return this.winner; };
        Game.prototype.getAttacker = function () { return this.attacker; };
        Game.prototype.getDefender = function () { return this.defender; };
        Game.prototype.addSpectator = function (s) {
            this.spectators.push(s);
        };
        Game.prototype.Board = function () { return this.board; };
        Game.prototype.processSetting = function (cellId) {
            return this.recordSetting(cellId);
        };
        Game.prototype.processMove = function (fromCellId, toCellId, resigned, exchangeRequest) {
            if (this.state !== Kharbga.GameState.Moving) {
                return false;
            }
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            this.moveFlags.resigned = resigned;
            if (this.moveFlags.resigned) {
                this.processCurrentPlayerAbandoned();
                if (eventData.player.isAttacker) {
                    this.winner = this.defender;
                    this.state = Kharbga.GameState.AttackerAbandoned;
                }
                else {
                    this.winner = this.attacker;
                    this.state = Kharbga.GameState.DefenderAbandoned;
                }
                eventData.player = this.winner;
                this.gameEvents.winnerDeclaredEvent(eventData);
                return true;
            }
            if (this.checkMoveSourceRequiredAndValidDestinations(toCellId) === false) {
                return false;
            }
            var ret = false;
            var fromCell = this.board.getCellById(fromCellId);
            if (fromCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.InvalidCellId, null, null, fromCellId);
                return ret;
            }
            if (fromCell.isOccupiedBy(this.getCurrentPlayer()) === false) {
                this.board.RaiseBoardInvalidMoveEvent(Kharbga.BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, fromCell, null, fromCellId);
                return ret;
            }
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
            if (fromCell === toCell) {
                this.gameEvents.newMoveCanceledEvent(eventData);
                return ret;
            }
            var result = this.board.RecordPlayerMove(fromCell, toCell);
            if (result.status === Kharbga.PlayerMoveStatus.OK) {
                var move = new Kharbga.GameMove(fromCell.id, toCell.id, this.currentPlayer);
                this.history.addMove(this.currentPlayer, fromCell.id, toCell.id);
                ret = true;
                this.checkUntouchableMoves(toCellId, exchangeRequest, eventData);
                if (this.currentPlayer.isAttacker) {
                    this.attackerMove++;
                }
                else {
                    this.defenderMove++;
                }
                if (result.capturedPieces === 0) {
                    eventData.targetCellId = toCellId;
                    this.gameEvents.newMoveCompletedEvent(eventData);
                    this.checkPlayerTurn();
                }
                else {
                    if (this.currentPlayer.isAttacker) {
                        this.defenderScore -= result.capturedPieces;
                    }
                    else {
                        this.attackerScore -= result.capturedPieces;
                    }
                    var stillHavePiecesToCaptureResult = this.board.StillHavePiecesToCapture(toCell);
                    if (stillHavePiecesToCaptureResult.status === false) {
                        eventData.targetCellId = toCellId;
                        this.gameEvents.newMoveCompletedEvent(eventData);
                        this.moveDestinationsPossibleCapture = null;
                        this.moveSourceRequiredAfterCapture = "";
                        this.checkPlayerTurn();
                    }
                    else {
                        eventData.targetCellId = toCell.id;
                        this.moveSourceRequiredAfterCapture = toCell.id;
                        this.moveDestinationsPossibleCapture = stillHavePiecesToCaptureResult.possibleMoves;
                        this.gameEvents.newMoveCompletedContinueSamePlayerEvent(eventData);
                    }
                }
                this.CheckScores();
            }
            else {
                eventData.move_status = result.status;
                this.gameEvents.invalidMoveEvent(eventData);
            }
            return ret;
        };
        Game.prototype.processMove2 = function (move, moveHandler) {
            var ret = this.processMove(move.from, move.to, move.resigned, move.exchangeRequest);
            if (moveHandler != null) {
                moveHandler.moveProcessed(ret, move);
            }
            return ret;
        };
        Game.prototype.checkIfSettingsCompleted = function () {
            if (this.board.allPiecesAreSet()) {
                this.state = Kharbga.GameState.Moving;
                this.firstMove = true;
                this.currentPlayer = this.attacker;
                var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);
            }
        };
        Game.prototype.checkPlayerTurn = function () {
            if (this.currentPlayer.isAttacker) {
                this.currentPlayer = this.defender;
            }
            else {
                this.currentPlayer = this.attacker;
            }
            this.moveSourceRequiredAfterCapture = "";
            this.moveDestinationsPossibleCapture = null;
            var eventData = new Kharbga.GameEventData(this, this.getCurrentPlayer());
            if (this.state === Kharbga.GameState.Moving) {
                if (this.currentPlayerIsBlocked() === true) {
                    if (this.currentPlayer.isAttacker) {
                        this.state = Kharbga.GameState.AttackerCanNotMove;
                    }
                    else {
                        this.state = Kharbga.GameState.DefenderCanNotMove;
                    }
                    if (this.firstMove) {
                        this.winner = this.defender;
                        eventData.player = this.winner;
                        this.state = Kharbga.GameState.WinnerDeclaredDefenderIsBlocked;
                        this.gameEvents.winnerDeclaredEvent(eventData);
                        return;
                    }
                    else {
                        this.gameEvents.playerPassedEvent(eventData);
                        this.state = Kharbga.GameState.Moving;
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
        Game.prototype.processCurrentPlayerAbandoned = function () {
            if (this.currentPlayer === this.attacker) {
                this.state = Kharbga.GameState.AttackerAbandoned;
                this.winner = this.defender;
            }
            else {
                this.state = Kharbga.GameState.DefenderAbandoned;
                this.winner = this.attacker;
            }
            var eventData = new Kharbga.GameEventData(this, this.winner);
            this.gameEvents.winnerDeclaredEvent(eventData);
        };
        Game.prototype.CheckScores = function () {
            if (this.defenderScore <= 0) {
                this.winner = this.attacker;
                this.state = Kharbga.GameState.DefenderLostAllPieces;
                var eventData = new Kharbga.GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            }
            else {
                if (this.attackerScore <= 0) {
                    this.state = Kharbga.GameState.AttackerLostAllPieces;
                    this.winner = this.defender;
                    var eventData2 = new Kharbga.GameEventData(this, this.winner);
                    this.gameEvents.winnerDeclaredEvent(eventData2);
                }
            }
        };
        Game.prototype.checkPass = function () {
            var bCanPass = this.checkIfCurrentPlayerCanPassTurn();
            if (bCanPass) {
                if (this.currentPlayer.isAttacker) {
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
        Game.prototype.checkIfCurrentPlayerCanPassTurn = function () {
            var possibleMoves = this.board.getPossibleMoves(this.currentPlayer);
            if (possibleMoves.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
        Game.prototype.currentPlayerIsBlocked = function () {
            var possibleMoves = this.board.getPossibleMoves(this.currentPlayer);
            if (possibleMoves.length === 0) {
                return true;
            }
            else {
                return false;
            }
        };
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
                    this.attackerScore++;
                }
                else {
                    this.defenderScore++;
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
        Game.prototype.is_in_moving_state = function () {
            return this.state === Kharbga.GameState.Moving;
        };
        Game.prototype.is_in_setting_state = function () {
            return this.state === Kharbga.GameState.Setting;
        };
        Game.prototype.is_surrounded_piece = function (selectedPieceId) {
            var clickedCell = this.board.getCellById(selectedPieceId);
            if (clickedCell === null) {
                return false;
            }
            return clickedCell.isSurrounded();
        };
        Game.prototype.checkUntouchableMoves = function (targetCellId, moveExchangeRequest, eventData) {
            if (this.currentPlayer.isAttacker === false) {
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
                    if (this.moveFlags.exchangeRequest === false) {
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                        return;
                    }
                    else {
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                        if (this.moveFlags.exchangeRequestAccepted && this.moveFlags.exchangeRequestAttackerPiece1 != ''
                            && this.moveFlags.exchangeRequestAttackerPiece2 !== "") {
                            var result = this.processUntouchableTwoExchange(this.moveFlags.exchangeRequestDefenderPiece, this.moveFlags.exchangeRequestAttackerPiece1, this.moveFlags.exchangeRequestAttackerPiece2);
                            if (result === true) {
                                this.gameEvents.untouchableExchangeCompletedEvent(eventData);
                                this.moveFlags.reset();
                                return;
                            }
                        }
                    }
                }
            }
            else {
                if (moveExchangeRequest === false) {
                    this.moveFlags.exchangeRequestAttackerPiece1 = "";
                    this.moveFlags.exchangeRequestAttackerPiece2 = "";
                    this.moveFlags.exchangeRequestDefenderPiece = "";
                    if (this.moveFlags.exchangeRequest || this.moveFlags.exchangeRequestAccepted) {
                        this.moveFlags.exchangeRequestAccepted = moveExchangeRequest;
                        this.gameEvents.untouchableExchangeCanceledEvent(eventData);
                    }
                    else {
                        this.moveFlags.exchangeRequestAccepted = moveExchangeRequest;
                    }
                    return;
                }
                else {
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
        Game.prototype.processUntouchableTwoExchange = function (untouchablePieceId, attackerPiece1, attackerPiece2) {
            var ret = this.board.recordExchange(untouchablePieceId, attackerPiece1, attackerPiece2);
            if (ret === true) {
                this.defenderScore--;
                this.attackerScore--;
                this.attackerScore--;
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
    var GameHistory = (function () {
        function GameHistory() {
            this.settings = [];
            this.moves = [];
        }
        GameHistory.prototype.addSetting = function (player, settingCellId) {
            var move = player.isAttacker ? "A" : "D" + ":" + settingCellId;
            this.settings.push(move);
        };
        GameHistory.prototype.addMove = function (player, fromCellId, toCellId) {
            var move = player.isAttacker ? "A" : "D" + ":" + fromCellId + "-" + toCellId;
            this.moves.push(move);
        };
        GameHistory.prototype.reset = function () {
            this.moves = [];
            this.settings = [];
        };
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
            this.id = "";
            this.state = 0;
            this.status = 0;
            this.moves = new Array();
            this.defender = new Kharbga.Defender();
            this.attacker = new Kharbga.Attacker();
            this.attackerName = "Attacker";
            this.defenderName = "Defender";
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.players = [this.attacker, this.defender];
            this.nextMoveNumber = 1;
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
            this.nextMoveNumber = 1;
            this.attackerName = "";
            this.defenderName = "";
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.moves = new Array();
            this.status = Kharbga.GameStatus.Created;
            this.state = Kharbga.GameState.NotStarted;
            this.attacker = null;
            this.defender = null;
            this.players = [];
        };
        GameInfo.prototype.update = function (gameInfo) {
            if (gameInfo == null) {
                return;
            }
            this.id = gameInfo.id;
            this.attackerName = gameInfo.attackerName;
            this.defenderName = gameInfo.defenderName;
            this.attackerScore = gameInfo.attackerScore;
            this.defenderScore = gameInfo.defenderScore;
            this.moves = new Array();
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
            return this.nextMoveNumber++;
        };
        return GameInfo;
    }());
    Kharbga.GameInfo = GameInfo;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var GameMove = (function () {
        function GameMove(from, to, p) {
            this.from = from;
            this.to = to;
            this.player = p;
            this.isSetting = false;
            this.exchangeRequest = false;
        }
        return GameMove;
    }());
    Kharbga.GameMove = GameMove;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
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
        return GameMoveFlags;
    }());
    Kharbga.GameMoveFlags = GameMoveFlags;
})(Kharbga || (Kharbga = {}));
var Kharbga;
(function (Kharbga) {
    var Player = (function () {
        function Player(isComputer, isAttacker, isSpectator) {
            this.occupiedCells = new Array(24);
            this.totalTimeThinkingSinceStartOfGame = 0;
            this.isAttacker = isAttacker;
            this.isSystem = isComputer;
            this.isSpectator = isSpectator;
        }
        Player.prototype.reset = function () {
            this.totalTimeThinkingSinceStartOfGame = 0;
        };
        return Player;
    }());
    Kharbga.Player = Player;
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
    var Defender = (function (_super) {
        __extends(Defender, _super);
        function Defender() {
            return _super.call(this, false, false, false) || this;
        }
        return Defender;
    }(Player));
    Kharbga.Defender = Defender;
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