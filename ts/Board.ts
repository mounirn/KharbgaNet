namespace Kharbga {
    /**
     * @summary Represents the game board composed of a 7 by 7 cells
     * The board is set by two players (an Attacker and a Defender)
     * two pieces at a time starting by the attacker
     */
    export class Board {
        UseArabicIds: boolean = false;
        boardEvents: IBoardEvents;

        cells: BoardCell[][];  // rows and columns
        cellsById: any = new Object(); // the cells dictionary accessed by cell ID
        _cellIds: string[];// the list of cell ids

        piecesSetCount = 0; // keeps track of the number of player pieces set on the board

        constructor(events: IBoardEvents) {
            this.UseArabicIds = false;  // default
            this.boardEvents = events;

            this.cells = [];  // init array
            for (let r: number = 0; r < 7; r++) {
                this.cells[r] = [];
                for (let c: number = 0; c < 7; c++) {
                    let cell: BoardCell = new BoardCell(this, r, c);
                    this.cells[r][c] = cell;
                    this.cellsById[cell.ID()] = cell;
                }
            }
            this._cellIds = Object.keys(this.cellsById);

            // process the board to set adjacent cells
            for (let id of this._cellIds) {
                let cell: BoardCell = this.cellsById[id] as BoardCell;
                cell.setAdjacentCells(this);
            }
        }

        /**
         * Creates a new board based with the same state
         */
        public clone(): Board {
            let ret: Board = new Board(null);

            for (let r: number = 0; r < 7; r++) {
                for (let c: number = 0; c < 7; c++) {
                    let cell: BoardCell = this.cells[r][c];

                    let clonedCell: BoardCell = ret.getCell(r, c);
                    clonedCell.setSameAs(cell);
                }
            }
            return ret;
        }
        /**
         * returns the current game fen which is a visual string representation of the board in the
         * format: /sSssSs1/2S2s1/7/7/7/ where digits represent the number of empty cells, S represents 
         * an attacker solider, 's' represents a defender solider.
         *
         */
        public fen(): string {
            let ret: string = "";
            for (let r: number = 6; r >= 0; r--) {
                for (let c: number = 0; c < 7; c++) {
                    let cell: BoardCell = this.cells[r][c];
                    if (cell.isEmpty()) {
                        ret += "1";
                    } else {
                        if (cell.isOccupiedByAttacker()) {
                            ret += "S";
                        } else {
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
        }

        /**
         * @summary Returns the cell by row and column numbers
         */
        getCell(row: number, col: number): BoardCell {
            /// add checks for the row and col
            return this.cells[row][col];
        }

        /**
         * @summary Returns the cell by a cell Id
         */
        getCellById(id: string): BoardCell {
            return this.cellsById[id] as BoardCell;
        }

        /**
         * @summary Checks if a given cell is occupied by the attacker
         * @param id the id of the cell to check
         * @returns true if a valid cell and occupied by the attacker, false otherwise
         */
        public isOccupiedByAttacker(id: string): boolean {
            let cell: BoardCell = this.getCellById(id);
            if (cell == null) {return false;}
            return cell.isOccupiedByAttacker();
        }
        /**
         * @summary Checks if a given cell is occupied by the defender
         * @param id the id of the cell to check
         * @returns true if a valid cell and occupied by the defender, false otherwise
         */
        public isOccupiedByDefender(id: string): boolean {
            let cell: BoardCell = this.getCellById(id);
            if (cell == null) {return false;}
            return cell.isOccupiedByDefender();
        }

        /**
         * @summary Records the player setting and returns true if a successful legal move
         * @param id - of the cell to set
         * @param isAttacker - indicates whether an attacker or a defender piece to set
         * @returns: the setting status code
         * @event:
         *      -- Invalid Move Event: A piece from either players is placed on the Malha
         *      -- Invalid Move Event: A piece is placed on an occupied cell
         */
        public recordPlayerSetting(id: string, isAttacker: boolean): PlayerSettingStatus {
            let cell: BoardCell = this.getCellById(id);
            if (cell == null) {
                console.log("invalid cell id passed: %s", id);

                return PlayerSettingStatus.ERR_INVALID_CELL;
            }
            var eventData: BoardEventData;
            if (cell.isMalha()) {
                if (this.boardEvents != null) {
                    // generate event
                    eventData = new BoardEventData(cell, cell, id, BoardMoveType.SettingOnMiddleCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return PlayerSettingStatus.ERR_MALHA;
            }
            if (cell.isOccupied()) {
                if (this.boardEvents != null) {
                    eventData= new BoardEventData(cell, cell, id, BoardMoveType.SettingOnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return PlayerSettingStatus.ERR_OCCUPIED;
            }

            cell.setPiece(isAttacker);
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
            if (fromCell.isSurrounded() === true) {
                if (this.boardEvents != null) {
                     var eventData: BoardEventData = new BoardEventData(fromCell, toCell, toCell.ID(),
                        BoardMoveType.SelectedCellThatIsSurroundedForMoving);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return { status: PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
            }

            // can not move to an occupied cell
            if (toCell.isOccupied() === true) {
                if (this.boardEvents != null) {
                    //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToAnOccupiedCell, fromCell.ID, toCell.ID, string.Empty));
                    var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovingToAnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return { status: PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
            }

            // the To cell must be adjacent to the From Cell
            if (fromCell.isAdjacentTo(toCell) === false) {
                if (this.boardEvents != null) {
                    var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovingToNotAdjacentCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return { status: PlayerMoveStatus.ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL, capturedPieces: 0 };
            }

            toCell.setSameAs(fromCell);
            fromCell.clear();

            if (this.boardEvents != null) {
                var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovedToAValidCell);
                this.boardEvents.validMoveEvent(eventData);
            }
            //
            let capturedCount = this.ProcessCapturedPieces(fromCell, toCell);

            return { status: PlayerMoveStatus.OK, capturedPieces: capturedCount };
        }

        /**
         * @summary Processes captured pieces by a given move. A move could capture up to 3 opponent pieces at a time
         * @param fromCell
         * @param toCell
         * @returns the number of pieces captured
         * @event  captured piece event
         */
        ProcessCapturedPieces(fromCell: BoardCell, toCell: BoardCell): number {
            let ret = 0;
            //0. Start with the To piece. 
            //1. Get all cells adjacent and occupied by the opponent (opposite color)
            //2. For each of these opponent cells, check if is "sandwiched" between the To cell type
            let toCellAdjacentCells = toCell.getAdjacentCells();
            let eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovedToAValidCell);

            for (let adjCell of toCellAdjacentCells) {
                if (adjCell.isEmpty() === true)  // not occupied
                    continue;

                if (adjCell.State() === toCell.State())  // occupied by the same piece as player
                    continue;

                // We have an opponent piece 
                if (toCell.Above() === adjCell) { // checking up
                    if (adjCell.Above() != null && adjCell.Above().State() === toCell.State()) {
                        adjCell.clear(); // Remove from the player pieces
                        eventData.targetCellId = adjCell.ID();
                        if (this.boardEvents != null)
                            this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Below() == adjCell) {// checking down     
                    if (adjCell.Below() != null && adjCell.Below().State() === toCell.State()) {
                        adjCell.clear();
                        eventData.targetCellId = adjCell.ID();
                        if (this.boardEvents != null)
                            this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Left() == adjCell) { // checking left;     
                    if (adjCell.Left() != null && adjCell.Left().State() === toCell.State()) {
                        adjCell.clear();
                        eventData.targetCellId = adjCell.ID();
                        if (this.boardEvents != null)
                            this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Right() == adjCell) { // checking right
                    if (adjCell.Right() != null && adjCell.Right().State() === toCell.State()) {
                        adjCell.clear();
                        eventData.targetCellId = adjCell.ID();
                        if (this.boardEvents != null)
                            this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
            }
            return ret;
        }

        /**
         * @summary checks if all players pieces are set
         * @returns true if the setting by the players is complete. Players take turn to set 24 pieces on the board
         */
        public allPiecesAreSet(): boolean {
            return this.piecesSetCount === 48;
        }

        /**
         * @summary Clears the board from all player pieces.
         */
        clear(): void {
            this.piecesSetCount = 0;
            for (let id of this._cellIds) {
                let cell:BoardCell = this.getCellById(id);
                if (cell != null){
                    cell.clear();
                }

            }
        }

        /**
         * @summary checks the board to identify a given player current positions
         * @param player - the player to check
         * @returns a list of ids of the cells occupied by the given player
         */
        GetPlayerPieces(player: Player): string[] {
            let ret: string[] = new Array<string>(24);
            for (let cellId of this._cellIds) {
                let cell: BoardCell = this.getCellById(cellId);
                if (cell.isOccupiedBy(player)) {
                    ret.push(cell.ID());
                }
            }
            return ret;
        }

        /**
         * @summary searches for possible moves for the given player and an optional from location
         * @param player
         * @param from Id (optional)
         * @returns the possible moves for this player
         */
        getPossibleMoves(player: Player, fromId: string = ""): GameMove[] {
            // 0. Get the player occupied cells
            // 1. For each of these occupied cells, get adjacent cells
            // 2.   For each adjacent cell, get empty cells
            // 3.        For each empty cell, record a possible move from occupied cell to the empty cell
            // 4.   Check if its the optional id
            let ret: GameMove[];

            for (let cellId of this._cellIds) {
                let fromCell: BoardCell = this.getCellById(cellId);

                if (fromCell.isOccupiedBy(player)) {
                    let adjacentCells: BoardCell[] = fromCell.getAdjacentCells();
                    for (let toCell of adjacentCells) {
                        if (toCell.isEmpty()) {
                            ret.push(new GameMove(fromCell.ID(), toCell.ID(), player));
                        }
                    }

                }
                // check if this is the only cell we want to check
                if (fromId === cellId) {
                    break;
                }

            }
            return ret;
        }


        /**
         * @summary searches for moves that includes unreachable pieces (from)
         * @param player
         * @param from Id (optional)
         * @returns the possible moves for this player that are not reachable by opponent
         */
        GetPossibleUnreachableMoves(player: Player, fromId: string = ""): Array<GameMove> {
            // 0. Get the player occupied cells that are unreachable
            // 1. For each of these occupied cells, get adjacent cells
            // 2.   For each adjacent cell, get empty cells
            // 3.        For each empty cell, record  possible move from occupied cell to the empty cell
            // 4.   Check if its the optional id
            let ret: Array<GameMove> = new Array<GameMove>(0);

            for (let cellId of this._cellIds) {
                let fromCell: BoardCell = this.getCellById(cellId);
                if (fromCell.isOccupiedBy(player)) {
                    if (!fromCell.isReachable(player)) { // if not reachable
                        let adjacentCells: BoardCell[] = fromCell.getAdjacentCells();
                        for (let toCell of adjacentCells) {
                            if (toCell.isEmpty()) {
                                ret.push(new GameMove(fromCell.ID(), toCell.ID(), player));
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
        }

        /**
         * @summary generate a invalid move event
         * @param boardMoveType - the move type
         * @param from - the from cell
         * @param to -- the to  cell
         */
        RaiseBoardInvalidMoveEvent(boardMoveType: BoardMoveType, from: BoardCell, to: BoardCell, invalidCellId: string): void {
            if (this.boardEvents != null) {
                var eventData: BoardEventData = new BoardEventData(from, to, invalidCellId, boardMoveType);
                this.boardEvents.invalidMoveEvent(eventData);
            }
        }

        /**
         * @summary Checks if the player still have more moves to make. If a move captures an opponent piece, 
         * the player is required to continue to move until there is no more moves that could capture pieces.
         * @param fromCell
         * @returns status -  true if there is at least one cell around fromCell from which a move that results in
         *   capturing at least one opponent piece could be made
         *  @returns possibleMoves to cell Ids that could make a capture
         */

        public StillHavePiecesToCapture(fromCell: BoardCell): { status: boolean, possibleMoves: Array<string> } {
            // to do: also return the possible move that could make a capture
            let moves: string[] = new Array<string>();
            let ret = { status: false, possibleMoves: moves };

            // 1. look at all possible moves (to adjacent cells)
            // 2. for each move
            // 3.    check if opponent pieces could be captured by the move
            // 4.          return true if can capture the opponent piece
            // 5. return false if no capturing moves.
            let adjCells: BoardCell[] = fromCell.getAdjacentCells();
            for (let cell of adjCells) {
                if (cell.isEmpty() === false) {
                    continue;
                }
                // can move here
                let toCell = cell;
                let toCellAjdCells = toCell.getAdjacentCells();
                for (let adjCell of toCellAjdCells) {
                    if (adjCell.isEmpty() == true)  // not occupied
                        continue;

                    if (adjCell.State() === fromCell.State())  // occupied by the same piece as player
                        continue;

                    // We have an opponent piece adjacent to the cell we are moving to
                    if (toCell.Above() === adjCell) // checking up
                    {
                        if (adjCell.Above() != null && adjCell.Above().State() === fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.ID());
                        }
                    }
                    else if (toCell.Below() === adjCell) // checking down
                    {
                        if (adjCell.Below() != null && adjCell.Below().State() == fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.ID());
                        }
                    }
                    else if (toCell.Left() == adjCell) // checking left;
                    {
                        if (adjCell.Left() != null && adjCell.Left().State() == fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.ID());
                        }
                    }
                    else if (toCell.Right() == adjCell) // checking right
                    {
                        if (adjCell.Right() != null && adjCell.Right().State() == fromCell.State()) {
                            ret.status = true;
                            ret.possibleMoves.push(toCell.ID());
                        }
                    }
                }
            }
            return ret;
        }

        /**
         * @summary Searches the current player positions for pieces that could be captured by opponent player
         * @param player - the player
         * @param opponent - the opponent player
         * @returns a tuple including the search status and a list of ids of cell that could be captured if success
         */
        public hasCapturablePieces(player: Player, opponent: Player): { status: boolean, capturables: string[] } {
            // to do: also return the possible move that could make a capture
            let capturables: string[] = new Array<string>();
            let ret = { status: false, "capturables": capturables };

            for (let cellId of this._cellIds) {
                let cell: BoardCell = this.getCellById(cellId);

                if (!cell.isOccupiedBy(player)) { continue; }

                if (cell.isSurrounded()) { continue; }

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
        }


        /**
         * Checks if the given cell is capturable
         * @param player the player occupying the cell
         * @param cellId the cell id
         */
        public isCapturable(player: Player, cellId: string): boolean {
            let cell:BoardCell = this.getCellById(cellId);

            if (cell == null) {
                console.log("IsCapturable - Invalid cell Id : %s", cellId);
                return false;
            }
            return cell.isCapturable(player);
        }

        /**
         * @summary Records a Defender exchange. The defender's untouchable piece is twice the value of the attacker's piece
         * @param untouchablePieceId the defender piece to exchange
         * @param attackerPiece1Id the attacker 1st piece
         * @param attackerPiece2Id the attacker 2nd piece
         * @returns true of successful, false otherwise
         */
        public recordExchange(untouchablePieceId: string, attackerPiece1Id: string, attackerPiece2Id: string): boolean {
            let uc: BoardCell = this.getCellById(untouchablePieceId);
            if (uc == null) { return false; }

            let ac1: BoardCell = this.getCellById(attackerPiece1Id);
            if (ac1 == null) { return false; }

            let ac2: BoardCell = this.getCellById(attackerPiece2Id);

            if (ac2 == null) { return false;}

            if (ac1 === ac2) { // need to be two different piece
                // need to raise an event here
                return false;
            }
            let eventData: BoardEventData = new BoardEventData(uc, uc, uc.ID(), BoardMoveType.DefenderPieceExchanged);
            uc.clear();
            this.boardEvents.exchangedPieceEvent(eventData);
            ac1.clear();
            eventData = new BoardEventData(ac1, ac1, ac1.ID(), BoardMoveType.DefenderPieceExchanged);
            this.boardEvents.exchangedPieceEvent(eventData);
            ac2.clear();
            eventData = new BoardEventData(ac2, ac2, ac2.ID(), BoardMoveType.DefenderPieceExchanged);
            this.boardEvents.exchangedPieceEvent(eventData);
            return true;
        }


        /**
         * @summary Searches for all possible settings for the game
         * @returns all possible settings for the game at this point
         */
        public getPossibleSettings(): string[] {
            let ret: string[] = new Array<string>();


            for (let id of this._cellIds) {
                let cell: BoardCell = this.cellsById[id] as BoardCell;
                if (id !== "d4" && cell.isEmpty() === true) {
                    ret.push(id);
                }
            }
            return ret;
        }

        /**
         * @summary Searches for all possible settings near opponent pieces
         * @param {Player} player: the current player
         * @returns all possible settings close to the opponent settings
         */
        public getPossibleSettingsNearOpponent(player: Player): string[] {
            let ret: string[] = new Array<string>();

            for (let id of this._cellIds) {
                let cell: BoardCell = this.cellsById[id] as BoardCell;
                if (id === "d4" || cell.isEmpty() !== true) {
                    continue;
                }
                if (cell.anyAdjacentOccupiedByOpponent(player)) {
                    ret.push(id);
                }
            }
            return ret;
        }
    }
}