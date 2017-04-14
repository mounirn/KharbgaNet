namespace Kharbga {
 /**
   * @summary Represents the game board composed of a 7 by 7 cells
   * The board is set by two players (an Attacker and a Defender) 
   * two pieces at a time starting by the attacker
   */
    export class Board {
        UseArabicIds: boolean = false;
        boardEvents: IBoardEvents;

        cells: BoardCell[][];  // Rows and Columns
      
        // The cells dictionary accessed by cell ID
        cellsById: any = new Object();

        // the list of cell ids
        _cellIds: string[];

        // Keeps track of the number of player pieces set on the board
        piecesSetCount = 0;

        constructor(events: IBoardEvents) {
            this.UseArabicIds = false;  // default
            this.boardEvents = events;

            this.cells = [];  // init array 
            for (let r = 0; r < 7; r++) {
                this.cells[r] = [];
                for (let c = 0; c < 7; c++) {
                    let cell = new BoardCell(this, r, c);
                    this.cells[r][c] = cell;
                    this.cellsById[cell.ID()] = cell;
                }
            }
            this._cellIds = Object.keys(this.cellsById);

            // Process the board to set adjacent cells
            for (let id of this._cellIds) {
                let cell = this.cellsById[id] as BoardCell;
                cell.SetAdjacentCells(this);
            }
        }
        /**
         * returns the current game fen 
         */
        fen(): string {
            var ret = "";
            for (let r = 6; r >= 0; r--) {
                 for (let c = 0; c < 7; c++) {
                     let cell = this.cells[r][c];
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

            // squeeze the numbers together
            // haha, I love this solution...
            ret = ret.replace(/1111111/g, '7');
            ret = ret.replace(/111111/g, '6');
            ret = ret.replace(/11111/g, '5');
            ret = ret.replace(/1111/g, '4');
            ret = ret.replace(/111/g, '3');
            ret = ret.replace(/11/g, '2');
            return ret;
        }

        /**
          * @summary Returns the cell by row and column numbers     
          */
        GetCell(row: number, col: number): BoardCell {
            ///Add checks for the row and col
            return this.cells[row][col];
        }

        /**
         * @summary Returns the cell by a cell Id
         */
        GetCellById(id: string): BoardCell {
            return this.cellsById[id] as BoardCell;
        }

        CellIds(): string[] {
            return this._cellIds;
        }

        IsOccupiedByAttacker(id: string): boolean {
            let cell = this.GetCellById(id);
            if (cell != null)
                return cell.IsOccupiedByAttacker();
            else
                return false;
        }
        IsOccupiedByDefender(id: string): boolean {
            let cell = this.GetCellById(id);
            if (cell != null)
                return cell.IsOccupiedByDefender();
            else
                return false;
        }

        /**
         * @summary Records the player setting and returns true if a successful legal move
         * @param id - of the cell to set
         * @param isAttacker - indicates whether an attacker or a defender piece to set
         * @returns: the setting status code
         * @event:
         *      -- A piece from either players is placed on the Malha
         *      -- A piece is placed on an occupied cell
         */
        RecordPlayerSetting(id: string, isAttacker: boolean): PlayerSettingStatus {
            let cell = this.GetCellById(id);
            if (cell == null) {
                console.log("invalid cell id passed: %s", id); 

                return PlayerSettingStatus.ERR_INVALID_CELL;
            }

            if (cell.IsMalha()) {
                // generate event
                //   BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SettingOnMiddleCell, id, string.Empty, string.Empty));
                var eventData = new BoardEventData(cell,cell, id, BoardMoveType.SettingOnMiddleCell);
                this.boardEvents.invalidMoveEvent(eventData);

                return PlayerSettingStatus.ERR_MALHA;
            }
            if (cell.IsOccupied()) {
                //BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SettingOnOccupiedCell, id, string.Empty, string.Empty));
                var eventData = new BoardEventData(cell, cell, id, BoardMoveType.SettingOnOccupiedCell);
                this.boardEvents.invalidMoveEvent(eventData);

                return PlayerSettingStatus.ERR_OCCUPIED;
            }

            cell.SetPiece(isAttacker);
            this.piecesSetCount++;
            return PlayerSettingStatus.OK;
        }

        /**
         * @summary Records the player move from fromCell to toCell if a successful move
         * @param fromCell the From Cell
         * @param toCell the To Cell
         * @returns returns the move status and the number of opponent pieces captured
         */
        RecordPlayerMove(fromCell: BoardCell, toCell: BoardCell): { status: PlayerMoveStatus, capturedPieces: number } {

            // can not move a surrounded cell
            if (fromCell.IsSurrounded() === true) {
                //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SelectedCellThatIsSourroundedForMoving, fromCell.ID, toCell.ID, string.Empty));
                var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.SelectedCellThatIsSurroundedForMoving);
                this.boardEvents.invalidMoveEvent(eventData);

                return { status: PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
            }

            // can not move to an occupied cell
            if (toCell.IsOccupied() === true) {        
                //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToAnOccupiedCell, fromCell.ID, toCell.ID, string.Empty));
                var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovingToAnOccupiedCell);
                this.boardEvents.invalidMoveEvent(eventData);

                return { status: PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
            }

            // the To cell must be adjacent to the From Cell
            if (fromCell.IsAdjacentTo(toCell) === false) {
                var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovingToNotAdjacentCell);
                this.boardEvents.invalidMoveEvent(eventData);

                return { status: PlayerMoveStatus.ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL, capturedPieces: 0 };
            }

            toCell.SetSameAs(fromCell);
            fromCell.Clear();
            // BoardMovedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovedToAValidCell, fromCell.ID, toCell.ID, string.Empty));
            var eventData = new BoardEventData(fromCell, toCell, toCell.ID(),  BoardMoveType.MovedToAValidCell);
            this.boardEvents.validMoveEvent(eventData);
            //
            let capturedCount = this.ProcessCapturedPieces(fromCell, toCell);

            return { status: PlayerMoveStatus.OK, capturedPieces: capturedCount };;
        }

        /**
         * @summary Processes captured pieces by a given move. A move could capture up to 3 opponent pieces at a time
         * @param fromCell
         * @param toCell
         * @returns the number of pieces captured
         * @event  captured piece event
         */
        ProcessCapturedPieces(fromCell: BoardCell, toCell: BoardCell): number {
            var ret = 0;
            //0. Start with the To piece. 
            //1. Get all cells adjacent and occupied by the opponent (opposite color)
            //2. For each of these opponent cells, check if is is "sandwitched" between the To cell type
            let toCellAdjacentCells = toCell.GetAdjacentCells();
            var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovedToAValidCell);

            for (let adjCell of toCellAdjacentCells) {
                if (adjCell.IsEmpty() === true)  // not occupied
                    continue;

                if (adjCell.State() === toCell.State() )  // occupied by the same piece as player
                    continue;

                // We have an opponent piece 
                if (toCell.Above() === adjCell) { // checking up
                    if (adjCell.Above() != null && adjCell.Above().State() === toCell.State()) {
                        adjCell.Clear(); // Remove from the player pieces
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedPieceEvent(eventData);
                         ret++;
                    }
                }
                else if (toCell.Below() == adjCell) {// checking down     
                    if (adjCell.Below() != null && adjCell.Below().State() === toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Left() == adjCell) { // checking left;     
                    if (adjCell.Left() != null && adjCell.Left().State() === toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Right() == adjCell) { // checking right
                    if (adjCell.Right() != null && adjCell.Right().State() === toCell.State()) {
                        adjCell.Clear();
                         eventData.targetCellId = adjCell.ID();
                        this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
            }
            return ret;
        }

        /**
         * @returns true if the setting by the players is complete. Players take turn to set 24 pieces on the board
         */
        AllPiecesAreSet(): boolean {
            return this.piecesSetCount == 48;
        }

        /**
         * @summary Clears the board from all player pieces.
         */
        Clear() {
            this.piecesSetCount = 0;

            for (let id in Object.keys(this.cellsById)) {
                let cell = this.GetCellById(id);
                if (cell != null)
                    cell.Clear();

            }
        }

        /**
         * @returns a list of cells occupied by the given player
         * @param player 
         */
        GetPlayerPieces(player: Player): Array<string> {
            let ret = new Array<string>(24);
            for (let cellId in Object.keys(this.cellsById)) {
                let cell = this.GetCellById(cellId);
                if (cell.IsOccupiedBy(player)) {
                    ret.push(cell.ID());
                }

            }
            return ret;
        }

        /**
         * 
         * @param player 
         * @returns the possible moves for this player
         */
        GetPossibleMoves(player: Player): Array<GameMove> {
            // 0. Get the player occupied cells
            // 1. For each of these cell get adjacent cells
            // 2.   For each adjacent cell, get empty cells
            // 3        For each empty cell, record a possible move from occupied cell to the empty cell
            let ret = new Array<GameMove>(5);
            let cellIds = this.CellIds();
            for (let cellId of cellIds) {
                let fromCell = this.GetCellById(cellId);
                if (fromCell.IsOccupiedBy(player)) {
                    let adjacentCells = fromCell.GetAdjacentCells();
                    for (let toCell of adjacentCells) {
                        if (!toCell.IsOccupied) {
                            ret.push(new GameMove(fromCell.ID(), toCell.ID(), player));
                        }
                    }
                }
            }
            return ret;
        }

        /**
         * @summary generate a invalid move event
         * @param boardMoveType - the move type
         * @param from - the from cell
         * @param to -- the to  cell
         */
        RaiseBoardInvalidMoveEvent(boardMoveType: BoardMoveType, from: BoardCell, to: BoardCell) {
            var eventData = new BoardEventData(from, to, to.ID(), boardMoveType);
            this.boardEvents.invalidMoveEvent(eventData);
        }

        /**
         * @summary Checks if the player still have more moves to make. If a move captures an opponent piece, 
         * the player is required to continue to move until there is no more moves that could capture pieces.
         * @param fromCell
         * @returns true if there is at least one cell around fromCell from which a move that results in
         *   capturing at least one opponent piece could be made
         * 
         */

        StillHavePiecesToCapture(fromCell: BoardCell): boolean {
            // to do: also return the possible move that could make a capture
            let ret = false;
            // 1. look at all possible moves (to adjacent cells)
            // 2. for each move
            // 3.    check if opponent pieces could be captured by the move
            // 4.          return true if can capture the opponent piece
            // 5. return false if no capturing moves.
            let adjCells = fromCell.GetAdjacentCells();
            for (let cell of adjCells) {
                if (cell.IsEmpty() == false)
                    continue;

                // can move here
                let toCell = cell;
                let toCellAjdCells = toCell.GetAdjacentCells();
                for (let adjCell of toCellAjdCells) {
                    if (adjCell.IsEmpty() == true)  // not occupied
                        continue;

                    if (adjCell.State() === fromCell.State())  // occupied by the same piece as player
                        continue;

                    // We have an opponent piece adjacent to the cell we are moving to
                    if (toCell.Above() === adjCell) // checking up
                    {
                        if (adjCell.Above() != null && adjCell.Above().State() === fromCell.State()) {
                            return true;
                        }
                    }
                    else if (toCell.Below() === adjCell) // checking down
                    {
                        if (adjCell.Below() != null && adjCell.Below().State() == fromCell.State()) {
                            return true;
                        }
                    }
                    else if (toCell.Left() == adjCell) // checking left;
                    {
                        if (adjCell.Left() != null && adjCell.Left().State() == fromCell.State()) {
                            return true;
                        }
                    }
                    else if (toCell.Right() == adjCell) // checking right
                    {
                        if (adjCell.Right() != null && adjCell.Right().State() == fromCell.State()) {
                            return true;
                        }
                    }
                }
            }
            return ret;
        }
        /**
         * @summary Records a Defender exchange. The defender's untouchable piece is twice the value of the attacker's piece 
         * @param untouchablePieceId
         * @param attackerPiece1Id
         * @param attackerPiece2Id
         */
        RecordExchange(untouchablePieceId: string, attackerPiece1Id: string, attackerPiece2Id: string) {
            let uc = this.GetCellById(untouchablePieceId);
            let ac1 = this.GetCellById(attackerPiece1Id);
            let ac2 = this.GetCellById(attackerPiece2Id);

            uc.Clear();
            ac1.Clear();
            ac2.Clear();

            //BoardExchangedPieceEvent(this, new BoardUntouchableExchangeEventArgs(untouchablePieceId, attackerPiece1Id,attackerPiece2Id));
        }
    }


}