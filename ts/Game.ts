namespace Kharbga {
    /**
     * Represents a game between two players.
     * Zero or more spectaors could be watching the game at the same time
     *
     */
    export class Game {
        id: string;  // the game id
        state: GameState;  // the game state as defined above
        board: Board = new Board(); // represents the game board
        startTime: Date;
        attacker: Attacker = new Attacker(); // represents the attacker
        defender: Defender = new Defender(); // represents the defender
        spectators: Array<Player> = new Array<Player>(2);
        history: GameHistory = new GameHistory(); // stores the history of all moves made
        currentPlayer: Player; // keeps track of who's turn it is
        winner: Player;

        gameEvents: IGameEvents;

        // temp counter used for Settings. Players are allowed to set two pieces at a time
        // starting with 24 pieces.
        numberOfSettingsAllowed = 2;
        attackerScore = 0;
        defenderScore = 0;

        // 
        // temp pointer indicating the from cell used in a game move (after setting is completed)
        fromCell: BoardCell = null;

        // temp pointers indicating pieces involved in a two exchange
        defenderIsRequestingExchange: boolean;
        defenderUntouchableMove: GameMove = null;
        attackerUntouchable1: GameMove = null;
        attackerUntouchable2: GameMove = null;

        /// <summary>
        /// Initializes the game to the no started state
        /// </summary>
        constructor(gameEvents : IGameEvents) {
            this.state = GameState.NotStarted;

            this.gameEvents = gameEvents;
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
         * returns true if the game is in setting mode. false, otherwise
         */
        public isInSettingMode() : boolean {
            return this.state == GameState.Setting;
        }

        /**
         * returns the game id
         */
        public getGameId(): string {
            return this.id;
        }

        /**
         * sets the game id
         * @param id  - the game id as set in storgae
         */
        public setGameId(id: string): void {
            this.id = id;
        }

        public getState(): GameState { return this.state; }

        /**
         * Starts a new game between two players on the same computer
         */
        public start(): void {
            this.init();
            this.reset();

            var eventData = new GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newGameStartedEvent(eventData);
            this.gameEvents.newPlayerTurnEvent(eventData);
         }

        /**
         * indicates whether the game is done or not
         */
        public game_over(): boolean {
            if (this.state == GameState.WinnerDeclared)
                return true;
            else
                return false;
        }
        /**
        * indicates whether the game is done or not
        */
        public game_setting_over(): boolean {
            if (this.state === GameState.Setting)
                return false;
            else return true;
        }

        /**
         * Identifies who's turn it is to play
         * Returns 'a' if atacker, 'd' if defender
         */
        public turn(): string {
            if (this.currentPlayer.IsAttacker()) return 'a';
            else return 'd';
        }
        /**
         *  Returns the game history manager
         */
        getHistory(): GameHistory { return this.history; }


        /**
         * Returns the current player
         */
        public getCurrentPlayer(): Player { return this.currentPlayer; }

        public getAttackerScore(): number { return this.attackerScore; }
        public getDefenderScore(): number { return this.defenderScore; }

        /**
         * Returns the startup time of the game
         */
        public getStartTime(): Date { return this.startTime; }

        /// <summary>
        /// Returns the time span since the game started
        /// </summary>
        //   public TimeSpan TimeSinceStartup { get { return DateTime.Now - _startTime; } }

        /**
         * returns the game's winner
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

        /// <summary>
        /// 
        /// </summary>
        /// <param name="s"></param>
        /**
         * Adds a spectator to the game (2.0 version)
         * @param s - the spectator
         */
        addSpectator(s: Player) {
            this.spectators.push(s);
        }

        /**
         * Returns the internal board representation
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
        }

        /**
         * Acts on the user requested move from by clicking on the cells 
         * @param cellId - the cell id clicked/selected by the user for a move start or end
         */
        public processMove(cellId: string): boolean {
            if (this.state == GameState.Setting) {
                return this.recordSetting(cellId);
            }
            else if (this.state == GameState.Moving) {
                return this.recordMove(cellId);
            }
            else
                return false;
        }

        /**
         *  Returns true if the board is ready to start playing after a new game
         */
        private checkIfSettingsCompleted(): void {
            if (this.board.AllPiecesAreSet()) {
                this.state = GameState.Moving;

                // SettingsCompletedEvent(this, null);
                var eventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);

            }
        }

        /**
         * checks if the current player can not move 
         */
        private checkIfPlayerCanNotMove(): void {
            ///TODO:
            /// Check if this case is not at the begining of the game. 
            /// Defendent wins the game if they are blocked after the first attacker move and no pieces are captured
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

        CurrentPlayerAbdondoned() {
            if (this.currentPlayer == this.attacker) {
                this.state = GameState.AttackerAbondoned;
                this.winner = this.defender;
            }
            else {
                this.state = GameState.DefenderAbondoned;
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

                //WinnerDeclaredEvent(this, null);
                var eventData = new GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            }
        }

        /// <summary>
        /// Pass by an attacker usually indicates that the attacker likes the defender to 
        /// show an untouchable piece that demands a two exchange.
        /// 
        /// The defender generally passes while demanding exchanges for his/her untouchables/unreachables pieces
        /// 
        /// </summary>
        CurrentPlayerPassed(): boolean {
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

                // NewPlayerTurnEvent(this, null);
                var eventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.newPlayerTurnEvent(eventData);
            }
            return bCanPass;
        }

        CheckIfCurrentPlayerCanPassTurn(): boolean {
            let possibleMoves = this.board.GetPossibleMoves(this.currentPlayer);
            if (possibleMoves.length == 0)
                return true;
            else
                return false;
        }


        /**
         * Records the current player request to set a piece. In order for a setting to be accepted, the
         * following conditions need to be met
         * @param cellId the id of a valid cell
         * @returns true if successful move. false otherwise
         */
        recordSetting(cellId: string): boolean {
            if (this.state != GameState.Setting)
                return false;

            let recorded = this.board.RecordPlayerSetting(cellId, this.getCurrentPlayer().IsAttacker());
            if (recorded == PlayerSettingStatus.OK) {
                let cell = this.board.GetCellById(cellId);
                this.numberOfSettingsAllowed--;
                this.history.AddSetting(this.currentPlayer, cell.ID());          

                if (this.getCurrentPlayer().IsAttacker)
                    this.attackerScore++;
                else
                    this.defenderScore++;

                // NewSettingCompletedEvent(this, new GameEventArgs(cellId, string.Empty, CurrentPlayer));
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


        /// <summary>
        /// Records a player's move from one cell to another after setting
        /// </summary>
        /// <param name="clickedCellId"></param>
        /// <returns>true if successful, false otherwise</returns>
        recordMove(clickedCellId: string) {
            if (this.state != GameState.Moving)
                return false;
            let ret = false;
            let clickedCell = this.board.GetCellById(clickedCellId);
            let toCell;
            // Not fromCell set yet
            if (this.fromCell == null) {
                // check if the piece clicke is the current player piece
                if (!clickedCell.IsOccupiedBy(this.getCurrentPlayer())) {
                    // Invalid piece selected (empty square or opponent piece)
                    this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, clickedCell, null);
                    return ret;
                }
                // Check if the piece selected could actually move
                if (clickedCell.IsSurrounded()) {
                    this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedCellThatIsSourroundedForMoving, clickedCell, null);
                    return ret;
                }

                // select the cell
                this.fromCell = clickedCell;
                //NewMoveStartedEvent(this, new GameEventArgs(_fromCell.ID, string.Empty, CurrentPlayer));
            }
            else {
                toCell = clickedCell;

                // deselection move/canceling move from fromCell
                if (this.fromCell == toCell) {
                    //    NewMoveCanceledEvent(this, new GameEventArgs(_fromCell.ID, toCell.ID, CurrentPlayer));
                    this.fromCell = null;
                    return true;
                }

                let result = this.board.RecordPlayerMove(this.fromCell, toCell);

                if (result.status == PlayerMoveStatus.OK) {
                    let move = new GameMove(this.fromCell.ID(), toCell.ID(), this.currentPlayer);
                    this.history.AddMove(this.currentPlayer, this.fromCell.ID(), toCell.ID());
                    //    NewMoveCompletedEvent(this, new GameEventArgs(_fromCell.ID, toCell.ID, CurrentPlayer));
                    this.fromCell = null; // reset for the next turn
                    ret = true;
                }

                // Check when a player needs to relinquish their turn to play
                // 
                // 1. If the last move captured no pieces, player must change turn change turn
                // 2. If the last move captured 1 or more pieces and the same piece can continue to move and 
                //    capture more pieces, the player must continue moving and caputuring the opponent pieces 
                //    until there are no more pieces to capture.
                //    
                if (result.capturedPieces == 0) {
                    // The move is completed with no capture
                    // Check untouchable exchange requests
                    ///todo fix this function checUntouchables
                    //this.CheckUntouchableMoves(move);

                    this.PlayerChangeTurn();
                }
                else {   // Update the scores
                    if (this.currentPlayer.IsAttacker()) {
                        this.defenderScore -= result.capturedPieces;
                    }
                    else
                        this.attackerScore -= result.capturedPieces;

                    if (!this.board.StillHavePiecesToCapture(toCell))
                        this.PlayerChangeTurn();

                    //Check the scores 
                    this.CheckScores();

                }
            }
            return ret;
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
        SetRequestingExchangeState(requestingExchange: boolean): void {
            // Exchange may not be the right word here
            // It is probably better to mention 
            this.defenderIsRequestingExchange = requestingExchange;

            if (requestingExchange != true) {
                this.defenderUntouchableMove = null;
                this.attackerUntouchable1 = null;
                this.attackerUntouchable2 = null;
                //UntouchableExchangeCanceled(this, null);

            }

        }

        /// <summary>
        /// Processes a request to exchange a defender piece with two of the attacker pieces
        /// </summary>
        /// <param name="untouchablePieceId"></param>
        /// <param name="attackerPiece1"></param>
        /// <param name="attackerPiece2"></param>
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