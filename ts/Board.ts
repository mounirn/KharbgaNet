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
         * Creates a new board based with the same state
         */
        public Clone() : Board{
            var ret = new Board(null);

            for (let r = 0; r < 7; r++) {                
                for (let c = 0; c < 7; c++) {
                    let cell = this.cells[r][c];

                    let clonedCell = ret.GetCell(r, c);

                    clonedCell.SetSameAs(cell);
                }
            }
            return ret;
        }
        /**
         * returns the current game fen 
         */
        public fen(): string {
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
                if (this.boardEvents != null) {
                    // generate event
                    //   BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SettingOnMiddleCell, id, string.Empty, string.Empty));
                    var eventData = new BoardEventData(cell, cell, id, BoardMoveType.SettingOnMiddleCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return PlayerSettingStatus.ERR_MALHA;
            }
            if (cell.IsOccupied()) {
                if (this.boardEvents != null) {
                    //BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SettingOnOccupiedCell, id, string.Empty, string.Empty));
                    var eventData = new BoardEventData(cell, cell, id, BoardMoveType.SettingOnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

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
                if (this.boardEvents != null) {
                    //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.SelectedCellThatIsSourroundedForMoving, fromCell.ID, toCell.ID, string.Empty));
                    var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.SelectedCellThatIsSurroundedForMoving);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return { status: PlayerMoveStatus.ERR_FROM_IS_SURROUNDED, capturedPieces: 0 };
            }

            // can not move to an occupied cell
            if (toCell.IsOccupied() === true) {   
                if (this.boardEvents != null) {
                    //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToAnOccupiedCell, fromCell.ID, toCell.ID, string.Empty));
                    var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovingToAnOccupiedCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return { status: PlayerMoveStatus.ERR_TO_IS_OCCUPIED, capturedPieces: 0 };
            }

            // the To cell must be adjacent to the From Cell
            if (fromCell.IsAdjacentTo(toCell) === false) {
                if (this.boardEvents != null) {
                    var eventData = new BoardEventData(fromCell, toCell, toCell.ID(), BoardMoveType.MovingToNotAdjacentCell);
                    this.boardEvents.invalidMoveEvent(eventData);
                }

                return { status: PlayerMoveStatus.ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL, capturedPieces: 0 };
            }

            toCell.SetSameAs(fromCell);
            fromCell.Clear();

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
            var ret = 0;
            //0. Start with the To piece. 
            //1. Get all cells adjacent and occupied by the opponent (opposite color)
            //2. For each of these opponent cells, check if is "sandwiched" between the To cell type
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
                        if (this.boardEvents != null) 
                            this.boardEvents.capturedPieceEvent(eventData);
                         ret++;
                    }
                }
                else if (toCell.Below() == adjCell) {// checking down     
                    if (adjCell.Below() != null && adjCell.Below().State() === toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        if (this.boardEvents != null) 
                            this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Left() == adjCell) { // checking left;     
                    if (adjCell.Left() != null && adjCell.Left().State() === toCell.State()) {
                        adjCell.Clear();
                        eventData.targetCellId = adjCell.ID();
                        if (this.boardEvents != null) 
                            this.boardEvents.capturedPieceEvent(eventData);
                        ret++;
                    }
                }
                else if (toCell.Right() == adjCell) { // checking right
                    if (adjCell.Right() != null && adjCell.Right().State() === toCell.State()) {
                        adjCell.Clear();
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
         * @summary searches for possible moves for the given player and an optional from location
         * @param player
         * @param from Id (optional)
         * @returns the possible moves for this player 
         */
        GetPossibleMoves(player: Player, fromId: string = ""): Array<GameMove> {
            // 0. Get the player occupied cells
            // 1. For each of these occupied cells, get adjacent cells
            // 2.   For each adjacent cell, get empty cells
            // 3.        For each empty cell, record a possible move from occupied cell to the empty cell
            // 4.   Check if its the optional id
            let ret = new Array<GameMove>(0);
            let cellIds = this.CellIds();
            for (let cellId of cellIds) {
                let fromCell = this.GetCellById(cellId);
              
                if (fromCell.IsOccupiedBy(player)) {
                    let adjacentCells = fromCell.GetAdjacentCells();
                    for (let toCell of adjacentCells) {
                        if (toCell.IsEmpty()) {
                            ret.push(new GameMove(fromCell.ID(), toCell.ID(), player));
                        }
                    }
                 
                }
                // check if this is the only cell we want to check
                if (fromId == cellId)
                    break;
                
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
            let ret = new Array<GameMove>(0);
            let cellIds = this.CellIds();
            for (let cellId of cellIds) {
                let fromCell = this.GetCellById(cellId);
                if (fromCell.IsOccupiedBy(player)) {
                    if (!fromCell.IsReachable(player)) { // if not reachable
                        let adjacentCells = fromCell.GetAdjacentCells();
                        for (let toCell of adjacentCells) {
                            if (toCell.IsEmpty()) {
                                ret.push(new GameMove(fromCell.ID(), toCell.ID(), player));
                            }
                        }

                    }
                }
                // check if this is the only cell we want to check
                if (fromId == cellId)
                    break;

            }
            return ret;
        }

        /**
         * @summary generate a invalid move event
         * @param boardMoveType - the move type
         * @param from - the from cell
         * @param to -- the to  cell
         */
        RaiseBoardInvalidMoveEvent(boardMoveType: BoardMoveType, from: BoardCell, to: BoardCell, invalidCellId: string) {
            if (this.boardEvents != null) {
                var eventData = new BoardEventData(from, to, invalidCellId, boardMoveType);
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
            var moves = new Array<string>();
            var ret = { status: false, possibleMoves: moves }; 

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
         * Checks the the given player has capturable pieces by the opponent player
         * @param player - the player
         * @param opponent - the opponent player 
         */
        public HasCapturablePieces(player: Player, opponent: Player): { status: boolean, capturables: Array<string> } {
            // to do: also return the possible move that could make a capture
            var capturables = new Array<string>();
            var ret = { status: false, "capturables": capturables };
            let cellIds = this.CellIds();
            for (let cellId of cellIds) {
                let cell = this.GetCellById(cellId);

                if (!cell.IsOccupiedBy(player)) 
                    continue;

                if (cell.IsSurrounded())
                    continue;

                // 1. look at all player pieces
                // 2. for each piece
                // 3.    check if piece has an adjacent empty cell
                // 4.    for each adjacent empty cell 
                // 5.       check if there is an adjacent opponent cell that could move to it    
                // 6.       check if the opposite adjacent cell is an opponent cell
                // 7. Indicate that this piece is capturable and add to the list of capturables

                // check Left
                if (cell.Left() != null && cell.Left().IsEmpty()) {
                    if (cell.Right()!= null && cell.Right().IsOccupiedBy(opponent) == false)
                    {
                        if (cell.Left().AnyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                            ret.status = true;
                        }
                    }
                }
                // check Right
                if (cell.Right() != null && cell.Right().IsEmpty()) {
                    if (cell.Left()!= null && cell.Left().IsOccupiedBy(opponent) == false) {
                        if (cell.Right().AnyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }
                // check up
                if (cell.Above() != null && cell.Above().IsEmpty()) {
                    if (cell.Below()!= null && cell.Below().IsOccupiedBy(opponent) == false) {
                        if (cell.Above().AnyAdjacentOccupiedBy(opponent)) {
                            capturables.push(cellId);
                        }
                    }
                }  
                // check down
                if (cell.Below() != null && cell.Below().IsEmpty()) {
                    if (cell.Above()!= null && cell.Above().IsOccupiedBy(opponent) == false) {
                        if (cell.Below().AnyAdjacentOccupiedBy(opponent)) {
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
        public IsCapturable(player: Player, cellId: string) {
            let cell = this.GetCellById(cellId);

            if (cell == null) {
                console.log("IsCapturable - Invalid cell Id : %s", cellId);
                return false;
            }
            return cell.IsCapturable(player);
        }

        /**
         * @summary Records a Defender exchange. The defender's untouchable piece is twice the value of the attacker's piece 
         * @param untouchablePieceId
         * @param attackerPiece1Id
         * @param attackerPiece2Id
         */
        RecordExchange(untouchablePieceId: string, attackerPiece1Id: string, attackerPiece2Id: string) : boolean {
            let uc = this.GetCellById(untouchablePieceId);
            if (uc == null)
                return false; 

            let ac1 = this.GetCellById(attackerPiece1Id);
            if (ac1 == null)
                return false; 

            let ac2 = this.GetCellById(attackerPiece2Id);

            if (ac2 == null)
                return false; 

            if (ac1 == ac2) {
                // need to be two different pieces
                return false;
            }
            var eventData = new BoardEventData(uc, uc, uc.ID(), BoardMoveType.DefenderPieceExchanged);
            uc.Clear();
            this.boardEvents.exchangedPieceEvent(eventData);
            ac1.Clear();
            eventData = new BoardEventData(ac1, ac1, ac1.ID(), BoardMoveType.DefenderPieceExchanged);
            this.boardEvents.exchangedPieceEvent(eventData);
            ac2.Clear();
            eventData = new BoardEventData(ac2, ac2, ac2.ID(), BoardMoveType.DefenderPieceExchanged);
            this.boardEvents.exchangedPieceEvent(eventData);
            return true;
            
        }


        /**
         * Returns all possible settings for the game at this point
         */
        public GetPossibleSettings(): Array<string>{
            var ret = new Array<string>();
            

            for (let id of this._cellIds) {
                let cell = this.cellsById[id] as BoardCell;
                if (id != 'd4' && cell.IsEmpty() == true)
                    ret.push(id);
            }

            return ret;
        }

        /**
        * Returns all possible settings close to the opponent settings
        */
        public GetPossibleSettingsNearOpponent(player: Player): Array<string> {
            var ret = new Array<string>();

            for (let id of this._cellIds) {
                let cell = this.cellsById[id] as BoardCell;
                if (id == 'd4' || cell.IsEmpty() != true)
                    continue;
                if (cell.AnyAdjacentOccupiedByOpponent(player) )
                    ret.push(id);
            }

            return ret;
        }

    }
   

}