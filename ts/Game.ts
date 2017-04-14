namespace Kharbga {
    /**
     * @summary Represents a game between two players. see readme.md for details about rules
     *
     */
    export class Game {
        id: string;  // the game id
        state: GameState;  // the game state as defined above
        board: Board; // represents the game board
        startTime: Date;
        attacker: Attacker = new Attacker(); // represents the attacker
        defender: Defender = new Defender(); // represents the defender
        spectators: Array<Player> = new Array<Player>(2);
        history: GameHistory = new GameHistory(); // stores the history of all moves made
        currentPlayer: Player; // keeps track of who's turn it is
        winner: Player;

        gameEvents: IGameEvents;
        boardEvents: IBoardEvents;

        // temp counter used for Settings. Players are allowed to set two pieces at a time
        // starting with 24 pieces.
        numberOfSettingsAllowed = 2;
        attackerScore = 0;
        defenderScore = 0;

        // 
        // temp pointer indicating the from cell used in a game move (after setting is completed)
        //fromCell: BoardCell = null;

        // temp pointers indicating pieces involved in a two exchange
        defenderIsRequestingExchange: boolean;
        defenderUntouchableMove: GameMove = null;
        attackerUntouchable1: GameMove = null;
        attackerUntouchable2: GameMove = null;

        /// <summary>
        /// Initializes the game to the no started state
        /// </summary>
        constructor(gameEvents: IGameEvents, boardEvents: IBoardEvents) {
            this.state = GameState.NotStarted;

            this.gameEvents = gameEvents;
            this.boardEvents = boardEvents; 

            this.board = new Board(boardEvents);

        }

        init() {
            this.id = "";
            this.startTime = new Date();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.currentPlayer = this.attacker;
            this.state = GameState.Setting;

        }
        /**
         * @returns all possible moves for the current player
         */
        public moves() : Array<GameMove> {
            var ret = this.board.GetPossibleMoves(this.currentPlayer);
            return ret;
        }
        /**
         * @returns the current game position - fen format
         */
        public fen(): string {

            return this.board.fen();
        }
        /**
         * @summary Sets the game with the given fen setting
         * @param fen
         */
        public set(fen: string) : boolean {
            if (this.validFen(fen) !== true) {
                return false;
            }

            // cut off any move, castling, etc info from the end
            // we're only interested in position information
            fen = fen.replace(/ .+$/, '');

            var rows = fen.split('/');
            var position = {};

            var currentRow = 7;
            for (var i = 0; i < 7; i++) {
                var row = rows[i].split('');
                var colIndex = 0;

                // loop through each character in the FEN section
                for (var j = 0; j < row.length; j++) {
                    // number / empty squares
                    if (row[j].search(/[1-7]/) !== -1) {
                        var emptySquares = parseInt(row[j], 10);
                        colIndex += emptySquares;
                    }
                    // piece
                    else {
                        var square = BoardCell.COLUMNS[colIndex] + currentRow;
                        var isAttackerPiece = this.isDefenderPiece(row[j]) === false; 
                    
                        var result = this.board.RecordPlayerSetting(square, isAttackerPiece);
                        if (result != PlayerSettingStatus.OK) {
                            //
                            console.log("Error loading fen: " + fen + " at square: " + square);
                            return false;
                        }
                        else {
                            if (isAttackerPiece)
                                this.attackerScore++;
                            else
                                this.defenderScore++;
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
        }

        /**
         * @summary Checks if the fen piece char is an Attacker or a Defender piece.
         * Defender pieces are in lower case.
         * @param piece - the piece code
         */
        isDefenderPiece(piece: string): boolean{          
            if (piece.toLowerCase() === piece)
                return true;
            else
                return false;
        }
        /**
         * @summary Checks if the give game fen string is valid or not
         * @param fen - the fen string
         */
        // TODO: this whole function could probably be replaced with a single regex
        validFen(fen:string ) : boolean {
            if (typeof fen !== 'string') return false;

            // cut off any move, castling, etc info from the end
            // we're only interested in position information
            fen = fen.replace(/ .+$/, '');

            // FEN should be 8 sections separated by slashes
            var chunks = fen.split('/');
            if (chunks.length !== 7) return false;   // MN only 7 rows

            // check the piece sections
            for (var i = 0; i < 7; i++) {
                if (chunks[i] === '' ||
                    chunks[i].length > 7 ||
                    chunks[i].search(/[^sS1-7]/) !== -1) {
                    return false;
                }
            }

            return true;
        }
        /**
         * @returns true if the game is in setting mode. false, otherwise
         */
        public isInSettingMode() : boolean {
            return this.state == GameState.Setting;
        }

        /**
         * @returns the game id
         */
        public getGameId(): string {
            return this.id;
        }

        /**
         * @summary sets the game id
         * @param id  - the game id as set in storgae
         */
        public setGameId(id: string): void {
            this.id = id;
        }

        /**
         * @returns the game state see GameState doc
         */
        public getState(): GameState { return this.state; }

        /**
         * @summary Starts a new game between two players on the same computer
         */
        public start(): void {
            this.init();
            this.reset();

            var eventData = new GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newGameStartedEvent(eventData);
            this.gameEvents.newPlayerTurnEvent(eventData);
         }

        /**
         * @summary indicates whether the game is done or not
         */
        public game_over(): boolean {
            if (this.state == GameState.WinnerDeclared)
                return true;
            else
                return false;
        }
        /**
        * @summary indicates whether the game is done or not
        */
        public game_setting_over(): boolean {
            if (this.state === GameState.Setting)
                return false;
            else return true;
        }

        /**
         * @summary Identifies who's turn it is to play
         * Returns 'a' if attacker, 'd' if defender
         */
        public turn(): string {
            if (this.currentPlayer.IsAttacker()) return 'a';
            else return 'd';
        }
        /**
         *  @returns the game history manager
         */
        getHistory(): GameHistory { return this.history; }

        /**
         * @returns the current player
         */
        public getCurrentPlayer(): Player { return this.currentPlayer; }

        public getAttackerScore(): number { return this.attackerScore; }
        public getDefenderScore(): number { return this.defenderScore; }

        /**
         * @returns the startup time of the game
         */
        public getStartTime(): Date { return this.startTime; }

        /// <summary>
        /// Returns the time span since the game started
        /// </summary>
        //   public TimeSpan TimeSinceStartup { get { return DateTime.Now - _startTime; } }

        /**
         * @returns the game's winner
         */
        getWinner(): Player { return this.winner; }

        /**
         *  Returns the attacker
         */
        getAttacker(): Player { return this.attacker; }

        /**
         * Returns the defender
         */
        getDefender(): Player { return this.defender; }

     
        /**
         * @summary Adds a spectator to the game (2.0 version)
         * @param s - the spectator
         */
        addSpectator(s: Player) {
            this.spectators.push(s);
        }

        /**
         * @returns the internal board representation
         */
        Board(): Board { return this.board; }

        /**
         * Resets the game. Clears the board and players info
         */
        public reset(): void {
            this.board.Clear();
            this.attacker.Reset();
            this.defender.Reset();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.winner = null;
            this.currentPlayer = this.attacker;
        }

        /**
        * @summary process a player setting
        * @param cellId - the cell id clicked/selected by the user 
        */
        public processSetting(cellId: string): boolean {
            if (this.state == GameState.Setting)
                return this.recordSetting(cellId);
            else
                return false;
        }
        /**
         * @summary Acts on the user requested move from one cell to another
         * @param fromCellId - the cell id of the from cell
         * @param toCellId - the cell id of the to cell
         */
        public processMove(fromCellId: string, toCellId: string): boolean {
            if (this.state != GameState.Moving)
                return false;
            let ret = false;
            let fromCell = this.board.GetCellById(fromCellId);
           
            // Not fromCell set yet
            if (fromCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.InvalidCellId, fromCell, null);
                return ret;
            }
            
            // check if the piece clicke is the current player piece
            if (fromCell.IsOccupiedBy(this.getCurrentPlayer()) === false) {
                // Invalid piece selected (empty square or opponent piece)
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, fromCell, null);
                return ret;
            }
            // Check if the piece selected could actually move
            if (fromCell.IsSurrounded()) {
               this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedCellThatIsSurroundedForMoving, fromCell, null);
                return ret;
            }

            let toCell = this.board.GetCellById(toCellId);;

            // deselection move/canceling move from fromCell
            if (fromCell === toCell) {
                var eventData = new GameEventData(this, this.getCurrentPlayer());
                eventData.from = fromCell;
                eventData.to = toCell;
                this.gameEvents.newMoveCanceledEvent(eventData)
                return ret;
            }

            let result = this.board.RecordPlayerMove(fromCell, toCell);
            var eventData = new GameEventData(this, this.getCurrentPlayer());
            eventData.from = fromCell;
            eventData.to = toCell;
            if (result.status == PlayerMoveStatus.OK) {
                let move = new GameMove(fromCell.ID(), toCell.ID(), this.currentPlayer);
                this.history.AddMove(this.currentPlayer, fromCell.ID(), toCell.ID());
              
                ret = true;

                // Check when a player needs to relinquish their turn to play
                // 
                // 1. If the last move captured no pieces, player must change turn change turn
                // 2. If the last move captured 1 or more pieces and the same piece can continue to move and 
                //    capture more pieces, the player must continue moving and capturing the opponent pieces 
                //    until there are no more pieces to capture.
                //    
                if (result.capturedPieces == 0) {
                    // The move is completed with no capture
                    // Check untouchable exchange requests
                    ///todo fix this function checkUntouchables
                    //this.CheckUntouchableMoves(move);

                    this.PlayerChangeTurn();
                    this.gameEvents.newMoveCompletedEvent(eventData)
                }
                else {   // Update the scores
                    if (this.currentPlayer.IsAttacker()) {
                        this.defenderScore -= result.capturedPieces;
                    }
                    else
                        this.attackerScore -= result.capturedPieces;

                    // check if the player could still 
                    if (this.board.StillHavePiecesToCapture(toCell) === false) {
                        this.gameEvents.newMoveCompletedEvent(eventData)
                        this.PlayerChangeTurn();
                        
                    }
                    else {
                        // add event that player should continue to play since they could still capture                       
                        this.gameEvents.newMoveCompletedContinueSamePlayerEvent(eventData)
                    }
                    //Check the scores 
                    this.CheckScores();
                }
            } else {
                eventData.move_status = result.status;
                this.gameEvents.invalidMoveEvent(eventData);
            }

            return ret;          
        }

        /**
         *  @returns true if the board is ready to start 2nd phase after setting 
         */
        private checkIfSettingsCompleted(): void {
            if (this.board.AllPiecesAreSet()) {
                this.state = GameState.Moving;

                this.currentPlayer = this.attacker;   // attackers start after finishing the game
                // check game options here if defender is to start

                // SettingsCompletedEvent(this, null);
                var eventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);
            }
        }

        /**
         * @summary checks if the current player can not move 
         */
        private checkIfPlayerCanNotMove(): void {
            ///TODO:
            /// Check if this case is not at the beginning of the game. 
            /// Defendant wins the game if they are blocked after the first attacker move and no pieces are captured
            this.PlayerChangeTurn();
        }

        private PlayerChangeTurn(): void {
            if (this.currentPlayer.IsAttacker())
                this.currentPlayer = this.defender;
            else
                this.currentPlayer = this.attacker;

            // raise an event a new player move
            //NewPlayerTurnEvent(this, null);
            var eventData = new GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newPlayerTurnEvent(eventData);

        }

        CurrentPlayerAbandoned() {
            if (this.currentPlayer == this.attacker) {
                this.state = GameState.AttackerAbandoned;
                this.winner = this.defender;
            }
            else {
                this.state = GameState.DefenderAbandoned;
                this.winner = this.attacker;
            }

            //WinnerDeclaredEvent(this, null);
            var eventData = new GameEventData(this, this.winner);
            this.gameEvents.winnerDeclaredEvent(eventData);

        }

        CheckScores(): void {
            if (this.defenderScore == 0) {
                this.winner = this.attacker;
                this.state = GameState.DefenderLostAllPieces;

                var eventData = new GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            }
        }

        /**
         * @summary  Pass by an attacker usually indicates that the attacker likes the defender to 
         *  show an untouchable piece that demands a two exchange.
         * The defender generally passes while demanding exchanges for his/her untouchables/unreachable pieces
         */
        public recordCurrentPlayerPassed(): boolean {
            let bCanPass = this.CheckIfCurrentPlayerCanPassTurn();

            // raise an event a new player move
            if (bCanPass) {
                // Add check to see if it is OK for the player to pass
                if (this.currentPlayer.IsAttacker) {
                    this.currentPlayer = this.defender;
                }
                else {
                    this.currentPlayer = this.attacker;
                }

                var eventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.newPlayerTurnEvent(eventData);
            }
            return bCanPass;
        }

        /**
         * @summary Checks if the current player can pass --- does not have any possible moves
         */
        CheckIfCurrentPlayerCanPassTurn(): boolean {
            let possibleMoves = this.board.GetPossibleMoves(this.currentPlayer);
            if (possibleMoves.length == 0)
                return true;
            else
                return false;
        }


        /**
         * @summary Records the current player request to set a piece. In order for a setting to be accepted, the
         * following conditions need to be met
         * @param cellId the id of a valid cell
         * @returns true if successful move. false otherwise
         */
        public recordSetting(cellId: string): boolean {
            if (this.state != GameState.Setting)
                return false;

            let recorded = this.board.RecordPlayerSetting(cellId, this.getCurrentPlayer().IsAttacker());
            if (recorded == PlayerSettingStatus.OK) {
                let cell = this.board.GetCellById(cellId);
                this.numberOfSettingsAllowed--;
                this.history.AddSetting(this.currentPlayer, cell.ID());          

                if (this.getCurrentPlayer().IsAttacker() === true)
                    this.attackerScore++;
                else
                    this.defenderScore++;

                var eventData = new GameEventData(this, this.getCurrentPlayer());
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
                // create an invalid setting event
                var eventData = new GameEventData(this, this.getCurrentPlayer());
                let cell = this.board.GetCellById(cellId);
                eventData.targetCellId = cellId;
                eventData.from = cell;
                eventData.to = cell;
                if (recorded === PlayerSettingStatus.ERR_MALHA)
                    this.gameEvents.invalidSettingMalhaEvent(eventData);
                else if (recorded === PlayerSettingStatus.ERR_OCCUPIED)
                    this.gameEvents.invalidSettingOccupiedEvent(eventData);
            }
            return recorded == PlayerSettingStatus.OK;
        }

        /**
         * @returns true if the game is in moving phase
         */
        public is_in_moving_state(): boolean {
            return this.state == GameState.Moving;
        }

        /**
         * Checks if the selected piece to drag is able to move
         * @param selectedPieceId
         */
        public is_surrounded_piece(selectedPieceId: string): boolean {
            let clickedCell = this.board.GetCellById(selectedPieceId);

            return clickedCell.IsSurrounded();
        }

        CheckUntouchableMoves(move: GameMove): void {
            if (this.defenderIsRequestingExchange == true) {
                if (this.currentPlayer.IsDefender()) {
                    this.defenderUntouchableMove = move;
                    //UntouchableSelectedEvent(this, new GameEventArgs(move.From, move.To, move.Player, true));

                }
                if (this.currentPlayer.IsAttacker() && this.defenderUntouchableMove != null) {
                    if (this.attackerUntouchable1 == null) {
                        this.attackerUntouchable1 = move;
                        //UntouchableSelectedEvent(this, new GameEventArgs(move.From, move.To, move.Player, true));
                    }
                    else if (this.attackerUntouchable2 == null) {
                        this.attackerUntouchable2 = move;
                        //UntouchableSelectedEvent(this, new GameEventArgs(move.From, move.To, move.Player, true));

                        this.ProcessUntouchableTwoExchange(this.defenderUntouchableMove.To,
                            this.attackerUntouchable1.To, this.attackerUntouchable2.To);

                        // It is the attacker turn after showing the pieces
                        // this.NewPlayerTurnEvent(this, null);
                    }
                }
            }
            else {
                this.defenderUntouchableMove = null;
                this.attackerUntouchable1 = null;
                this.attackerUntouchable2 = null;
            }
        }

        processRequestingExchange(requestingExchange: boolean): void {
            // Exchange may not be the right word here
            // It is probably better to mention sacrifice
            this.defenderIsRequestingExchange = requestingExchange;

            if (requestingExchange != true) {
                this.defenderUntouchableMove = null;
                this.attackerUntouchable1 = null;
                this.attackerUntouchable2 = null;
                //UntouchableExchangeCanceled(this, null);
            }
        }

        /** @summary Processes a request to exchange a defender piece with two of the attacker pieces
         *
         * @param untouchablePieceId - the id of the defender piece to exchange
         * @param attackerPiece1 - the id of the attacker's 1st piece to exchange
         * @param attackerPiece2 - the id of the attacker's 2nd piece to exchange
        */
        ProcessUntouchableTwoExchange(untouchablePieceId: string, attackerPiece1: string, attackerPiece2: string) {
            //steps:
            // - check if the defender piece is able to move and is not reachable
            // - check if the attacker pieces can move freely
            // if ok allow the exchange, other generate an error message using events
            this.board.RecordExchange(untouchablePieceId, attackerPiece1, attackerPiece2);
            this.defenderScore--;
            this.attackerScore--;
            this.attackerScore--;
        }
    }
}