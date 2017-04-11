namespace Kharbga {
    /**
     * Defines the player types. We could have games where:
     * - a person plays against another person
     * - a computer plays against another computer
     * - a person plays against a computer
     */
    export enum PlayerType {
        Person,
        Computer
    }


    /**
     * A player could be either an attacker, a defender, or spectator. 
     * A spectator could make move suggestions to either players assuming they are given 
     * the OK.
     */
    export enum PlayerRole {
        Attacker,
        Defender,
        Spectator
    }

    export enum PlayerSettingStatus {
        OK,
        ERR_INVALID_CELL,
        ERR_MALHA,
        ERR_OCCUPIED
    }

    export enum PlayerMoveStatus {
        OK,
        ERR_FROM_IS_SURROUNDED,
        ERR_TO_IS_OCCUPIED,
        ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL
    }

    /**
     * Defines the possible states of a cell
     */
    export enum BoardCellState {
        Empty,
        OccupiedByAttacker,
        OccupiedByDefender,
        OccupiedByDefenderRequestingTwo
    }

    /// <summary>
    /// Defines various move error cases
    /// </summary>
    export enum BoardMoveType {
        SettingOnValidCell,
        SettingOnOccupiedCell,
        SettingOnMiddleCell,
        SelectedCellThatIsSourroundedForMoving,
        SelectedEmptyOrOpponentPieceForMoving,
        MovingToAnOccupiedCell,
        MovingToNotAjacentcell,
        MovedToAValidCell,
        OpponentPieceCaptured
    };

    /**
     * Players 
     */
    export enum PieceState {
        IsNotSetYet,  // Waiting to be set
        IsOnBoard,    // Is already set
        IsOnBoardUntouchable,    // useful for defender only (able to move and is unreachable)
        IsCapturedOnBoard,
        IsCapturedOffBoard,
        IsExchanged
    }
    /**
     * Defines the possible states of a game
     */
    export enum GameState {
        // The game at startup. 
        NotStarted,


        /// The game starts by the attacker setting his/her pieces on the board with the objective
        /// of caputuring the defender's pieces and limiting the defender from building up protected 
        /// areas where his pieces could freely move.
        /// 
        /// The defender's objective is to protect his pieces, capture the attacker's pieces (Agban), and 
        /// buildup protected areas where the attacker can not move into.
        /// The defender's pieces that can freely move in these protected areas are called Untouchables (mhaffef). 
        /// 
        /// The only way for the attacker to remove Untouchable pieces from the board is to pay the defender using
        /// two of his/her own pieces. The three pieces involved in the exchange must be approved by the defender. 
        /// 
        /// With these Untouchable pieces, the defender could win the game if the attacker can not make
        /// exchanges.  
        Setting,

        /// This is an illegal condition at the begining of a game. 
        /// After setting is completed, the attacker is required to move first. 
        /// After the attacker's first move is completed, the defender must be 
        /// able to play. If the defender is blocked after the first move, the attacker loses and 
        /// the defender is declated a winner. After the first move by the defender, the attacker can 
        /// block the defender from moving. In this case, the defender must pass thier turn 
        /// and request the attacker to continue playing until one or more pieces of the 
        /// defender are unblocked. In most cases, this condition results in the defender losing 
        /// all their pieces. 
        DefenderCanNotMove,

        ///  This state happens after the first move by the defender. It is legal state and attacker loses the game
        ///  in most cases. In this legal case, the defender can freely move their pieces until the attacker is unblocked and is able to play. 
        AttackerCanNotMove,

        /// After completing s
        Moving,

        /// In this state, the defender is able to freely move a piece in an protected area unreachable by 
        /// the attacker and is demanding exchanges (one piece of the defender for two pieces of the attacker). The attacker's 
        /// pieces must be able to freely move. 
        DefenderMovingUntouchable,

        /// The attacker abondons play and loses the game when they can not capture all of the defender's pieces. 
        /// The defender's untouchable pieces are twice the value of the attacker's pieces. 
        AttackerAbondoned,

        /// The defender abondons play and loses the game when all their pieces are captured 
        DefenderAbondoned,

        /// Defender lost all pieces.
        DefenderLostAllPieces,

        WinnerDeclared
    }

    export enum GameActionType {
        Setting,
        Move,
        MoveCapture,
        DefenderRequestTwo,
        DefenderRequestTwoAccepptedByAttacker
    }

    /**
     * Represents a game player. The game is played by two players, an attacker and a defender. Players use 24 game pieces to set the board. 
     * The players take turns in setting the board two pieces each turn.
     * After the board is set, players take turns to make game mvoes capturing each other pices or demanding exchanges. the Attacker has the
     * advantages of setting his two pieces first.   The Defender follows a setting strategy so their pieces do not get captured by the Attacker.
     */
    export class Player {
        occupiedCells = new Array(24);
        type: PlayerType;
        role: PlayerRole;
        toalTimeThinkingSinceStartOfGame: 0;
        constructor(role: PlayerRole) {
            this.type = PlayerType.Person;
            this.role = role;
        }

        /// The player selects a color to use for their pieces and profile
        public Color: string

        /// The player selects an image to use for their pieces and profile
        public Image: string

        /// The name of the player
        public Name: string

        // This is the user's account id
        public EmailAddress: string

        /// A player could be either an attacker or a defender
        IsAttacker(): boolean { return this.role == PlayerRole.Attacker; }
        IsDefender(): boolean { return this.role == PlayerRole.Defender; }



        Type(): PlayerType { return this.type; }
        Role(): PlayerRole { return this.role; }


        Reset(): void {
            this.toalTimeThinkingSinceStartOfGame = 0;
        }
    }

    /**
     * The attacker is the first one who starts the setting and the one that makes the first move
     * 
     */
    export class Attacker extends Player {
        constructor() {
            super(PlayerRole.Attacker);

        }
    }

    /**
     * Defender follows the attacker setting
     */
    export class Defender extends Player {
        constructor() {
            super(PlayerRole.Defender);

        }
    }

    /// <summary>
    /// Reprsents the piece that players use to make their moves on the board
    /// </summary>
    export class Piece {
        state: PieceState;

        constructor() {
            this.state = PieceState.IsNotSetYet;
        }
        State(): PieceState {
            return this.state;
        }


        Value(): number {
            if (this.State() == PieceState.IsOnBoard)
                return 1;
            else if (this.State() == PieceState.IsOnBoardUntouchable)
                return 100;
            else
                return 0;
        }
    }

    export class GameMove {
        constructor(from: string, to: string, p: Player) {
            this.From = from;
            this.To = to;
            this.Player = p;
        }
        public From: string;
        public To: string;
        public Player: Player;
    }

    /**
     * Represents the game baord composed of a 7 by 7 cells
     * The board is set by players pieces at 
     */
    export class Board {
        UseArabicIds: boolean = false;
        cells: BoardCell[][];  // Rows and Columns

        // Dictionary<string, BoardCell> _dictCells = new Dictionary<string, BoardCell>(49);

        // The cells dictionary accessed by cell ID
        cellsById: any = new Object();

        // the list of cells ids
        _cellIds: string[];

        // Keeps track of the number of player pieces set on the board
        piecesSetCount = 0;

        constructor() {
            this.UseArabicIds = false;  // default
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
          * Returns the cell by row and column numbers
          *
          */
        GetCell(row: number, col: number): BoardCell {
            ///Add checks for the row and col
            return this.cells[row][col];
        }

        /**
         * Returns the cell by a cell Id
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
         * Records the player setting
         * Returns true if a successful legal move
         * @param id - the cell id
         * @param isAttacker - indicates whether an attacker or a defender piece
         * @returns: the setting status code
         * events:
         *      -- A piece from either players is placed on the Malha
         *      -- A piece is placed on an occupied cell
         */
        RecordPlayerSetting(id: string, isAttacker: boolean): PlayerSettingStatus {
            let cell = this.GetCellById(id);
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
        }

        /**
         * Records the player move from fromCell to toCell if a successful move
         * @param fromCell the From Cell
         * @param toCell the To Cell
         * @returns returns the move status and the number of captured
         */
        RecordPlayerMove(fromCell: BoardCell, toCell: BoardCell): { status: PlayerMoveStatus, capturedPieces: number } {

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
            let capturedCount = this.ProcessCapturedPieces(fromCell, toCell);

            return { status: PlayerMoveStatus.OK, capturedPieces: capturedCount };;
        }

        /**
         * Processes captured pieces by given move
         * @param fromCell
         * @param toCell
         * @returns reutns the number of pieces captured
         */
        ProcessCapturedPieces(fromCell: BoardCell, toCell: BoardCell): number {

            var ret = 0;
            //0. Start with the To piece. 
            //1. Get all cells adjacent and occupied by the opponent (opposite color)
            //2. For each of these Opponent Cells, check if is is between 
            //   the to piece and a piece of the same type
            let toCellAdjacentCells = toCell.GetAdjacentCells();
            for (let adjCell of toCellAdjacentCells) {
                if (adjCell.IsEmpty())  // not occupied
                    continue;

                if (adjCell.State == toCell.State)  // occupied by the same piece as player
                    continue;

                // We have an opponent piece 
                if (toCell.Above() == adjCell) { // checking up
                    if (adjCell.Above() != null && adjCell.Above().State() == toCell.State()) {
                        adjCell.Clear(); // Remove from the player pieces
                        //BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                        ret++;

                    }
                }
                else if (toCell.Below() == adjCell) {// checking down     
                    if (adjCell.Below() != null && adjCell.Below().State() == toCell.State()) {
                        adjCell.Clear();
                        // BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                        ret++;
                    }
                }
                else if (toCell.Left() == adjCell) { // checking left;     
                    if (adjCell.Left() != null && adjCell.Left().State() == toCell.State()) {
                        adjCell.Clear();
                        //BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                        ret++;
                    }
                }
                else if (toCell.Right() == adjCell) { // checking right
                    if (adjCell.Right() != null && adjCell.Right().State() == toCell.State()) {
                        adjCell.Clear();
                        //BoardCapturedPieceEvent(this, new BoardMoveEventArgs(BoardMoveType.MovingToNotAjacentcell, fromCell.ID, toCell.ID, adjCell.ID));
                        ret++;
                    }
                }
            }
            return ret;
        }

        /**
         * returns true if the setting by the players is complete. Players take turn to set 24 pieces on the baord
         */
        AllPiecesAreSet(): boolean {
            return this.piecesSetCount == 48;
        }

        /**
         * Clears the board from all player pieces.
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
         * returns a list of cells occupied by the given player
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

        /// <summary>
        /// Returns the possible moves for this player
        /// </summary>
        /// <returns>a list of moves</returns>
        GetPossibleMoves(player: Player): Array<GameMove> {
            // 0. Get the player occupied cells
            // 1. For each of these cell get adjacenet cells
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

        RaiseBoardInvalidMoveEvent(boardMoveType: BoardMoveType, from: BoardCell, to: BoardCell) {
            //  BoardInvalidMoveEvent(this, new BoardMoveEventArgs(boardMoveType, from != null ? from.ID : string.Empty, to != null ? to.ID : string.Empty, string.Empty));
        }

        /**
         * Checks if the player still have more moves to make. If a move captures an opponent piece, the player is required
         * to continue to move until there is no more moves that could capture pieces.
         * @param fromCell
         * @returns true if there is at least one cell around fromCell from which a move that results in
         *             capturing at least one opponent piece could be made
         */

        /// <returns>
        /// </returns>
        StillHavePiecesToCapture(fromCell: BoardCell): boolean {
            let ret = false;
            // 1. look at all possible moves (to adjacent cells)
            // 2. for each move
            // 3.    check if oppponent pieces could be captured by the move
            // 4.          return true if can capture the opponent piece
            // 5. return false if no capturing moves.
            let adjCells = fromCell.GetAdjacentCells();
            for (let cell of adjCells) {
                if (!cell.IsEmpty)
                    continue;

                // can move here
                let toCell = cell;
                let toCellAjdCells = toCell.GetAdjacentCells();
                for (let adjCell of toCellAjdCells) {
                    if (adjCell.IsEmpty)  // not occupied
                        continue;

                    if (adjCell.State() == fromCell.State())  // occupied by the same piece as player
                        continue;

                    // We have an opponent piece adjacent to the cell we are moving to
                    if (toCell.Above() == adjCell) // checking up
                    {
                        if (adjCell.Above() != null && adjCell.Above().State() == fromCell.State()) {
                            return true;
                            // Remove from the player pieces
                        }
                    }
                    else if (toCell.Below() == adjCell) // checking down
                    {
                        if (adjCell.Below != null && adjCell.Below().State() == fromCell.State()) {
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
         * Records a Defender exchange. The defender's untouchable piece is twice the value of the attacker's piece 
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

    export class BoardCell {
        static RightLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
        static LeftLabels = ["A", "B", "C", "D", "E", "F", "G"];
        board: Board;

        row: number;
        col: number;
        id: string;

        state: BoardCellState = BoardCellState.Empty;

        left: BoardCell = null;
        right: BoardCell = null;
        up: BoardCell = null;
        down: BoardCell = null;

        listAdjacentCells: BoardCell[];

        /**
         * Board cells are created by the board
         * @param b
         * @param row
         * @param col
         */
        constructor(b: Board, row: number, col: number) {
            this.board = b;
            this.row = row;
            this.col = col;
            this.id = BoardCell.LeftLabels[row] + (col + 1).toString();

            this.listAdjacentCells = [];  
            // setup adjacent cells
            this.SetAdjacentCells(b);

        }

        /**
         *  Returns the row 0-6
         */
        Row(): number {
            return this.row;
        }

        /**
         * Returns The col from 0-6
         */
        Col(): number {
            return this.col;
        }

        /**
         * the ID in the format "RowCol" where Row are letters from A-G or alif to to kha.
         * and Col from 1-7
         */
        ID(): string {
            return this.id;
        }

        /**
         * Returns the cell above or null if on the top edge
         */
        Above(): BoardCell {
            return this.up;
        }

        /**
         * Returns the cell below or null if on the bottom edge
         */
        Below(): BoardCell {
            return this.down;
        }

        /**
         * Returns the cell to the right or null if on the right edge
         */
        Right(): BoardCell {
            return this.right;
        }

        /**
         * Returns cell to the left or null if on the left edge
         */
        Left(): BoardCell {
            return this.left;
        }

        /**
         * Returns the current cell state
         */
        State(): BoardCellState {
            return this.state;
        }

        /**
         * Checks if the current cell is occupied or not
         */
        IsOccupied(): boolean {
            return this.state == BoardCellState.Empty;
        }

        /**
         * Checks if the current cell is occupied by an attacker piece or not
         */
        IsOccupiedByAttacker(): boolean {
            return this.state == BoardCellState.OccupiedByAttacker;
        }


        /**
         * Checks if the current cell is occupied by a defender piece or not
         */
        IsOccupiedByDefender(): boolean {
            return this.state == BoardCellState.OccupiedByDefender;
        }

        /**
         * Check id the current cell is the middle cell which is left empty after each player sets their peices on the board
         * Malha means salty in Arabic.  Players are not allowed to set (seed) their piece on the salty land.
         */
        IsMalha(): boolean {
            if (this.row == 3 && this.col == 3)
                return true;
            else
                return false;
        }

        /**
         * Set a piece on the board with either an attacker or a defender piece
         * @param playerIsAttacker indicates whether an attacker or a defender setting
         */
        SetPiece(playerIsAttacker: boolean): void {
            if (playerIsAttacker)
                this.state = BoardCellState.OccupiedByAttacker;
            else
                this.state = BoardCellState.OccupiedByDefender;
        }

        /**
         *  set a piece with the same state as the give cell
         * @param cell
         */
        SetSameAs(cell: BoardCell): void {
            this.state = cell.state;
        }

        /**
         * Determines the adjacent cells and sets then for easy access from each cell 
         */
        SetAdjacentCells(board: Board) {
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
        }

        /**
         * Returns the adjacent cells
         */
        GetAdjacentCells(): BoardCell[] {
            return this.listAdjacentCells;
        }

        /**
         * Checks if the give cell is adjacent to this one
         * @param cell
         */
        IsAdjacentTo(cell: BoardCell) {
            this.listAdjacentCells.forEach(function (e) {
                if (e == cell)
                    return true;
            });

            return false;
        }

        Clear() {
            this.state = BoardCellState.Empty;
        }

        IsOccupiedBy(player: Player): boolean {
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
        }


        IsEmpty(): boolean {
            return this.state == BoardCellState.Empty;
        }

        /**
         * A surrounded piece can not move
         */
        IsSurrounded(): boolean {
            var ret = true;
            this.listAdjacentCells.forEach(function (e) {
                if (e.IsEmpty) {
                    ret = false;
                    return;
                }

            });

            return ret;
        }

        IsDefenderRequestingTwo(): boolean {
            return this.state == BoardCellState.OccupiedByDefenderRequestingTwo;
        }

    }
}