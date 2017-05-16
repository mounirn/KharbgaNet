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
        attackerMove = 0;
        defenderMove = 0;
        moveSourceRequired: string = "";
        moveDestinationsPossible: Array<string> = null;
        firstMove = true;

        // current state of the move params
        moveFlags: GameMoveFlags;

        /// <summary>
        /// Initializes the game to the no started state
        /// </summary>
        constructor(gameEvents: IGameEvents, boardEvents: IBoardEvents) {
            this.state = GameState.NotStarted;

            this.gameEvents = gameEvents;
            this.boardEvents = boardEvents;

            this.board = new Board(boardEvents);
            this.moveFlags = new GameMoveFlags();

        }

        init() {
            this.id = "";
            this.startTime = new Date();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.attackerMove = 0;
            this.defenderMove = 0;
            this.currentPlayer = this.attacker;
            this.state = GameState.Setting;
            this.firstMove = true;
            this.reset();

        }
        /**
         * @returns all possible moves for the current player
         */
        public moves(from: string = ""): Array<GameMove> {
            var ret = this.board.GetPossibleMoves(this.currentPlayer, from);




            return ret;
        }

        /**
         * identifies moves that result in a capture of one of the opponent pieces
         * @param from -- optional from location
         */
        public moves_that_capture(from: string = ""): Array<GameMove> {
            var temp = this.board.GetPossibleMoves(this.currentPlayer, from);

            var ret = new Array<GameMove>();
            for (let move of temp) {
                // check if the from cell could capture
                var fromCell = this.board.GetCellById(move.From);
                if (fromCell == null)
                    continue;

                var result = this.board.StillHavePiecesToCapture(fromCell);
                if (result.status == true) {
                    if (result.possibleMoves.indexOf(move.To) >= 0)
                        ret.push(move);
                }
            }

            return ret;
        }

        /**
         * Identifies moves by capturable pieces (hopefully to save)
         * @param from
         */
        public moves_by_capturables(from: string = ""): Array<GameMove> {
            var temp = this.board.GetPossibleMoves(this.currentPlayer, from);

            var ret = new Array<GameMove>();
            for (let move of temp) {
                var capturable = this.board.IsCapturable(this.currentPlayer, move.From);
                if (capturable) {
                    ret.push(move);
                }
            }
            return ret;
        }
        /**
        * identifies moves that result in saving own pieces
        * @param from -- optional from location
        */
        public moves_that_save(from: string = ""): Array<GameMove> {

            let result = this.board.HasCapturablePieces(this.currentPlayer, this.currentPlayer.IsAttacker ? this.defender : this.attacker);

            let tempMoves = this.board.GetPossibleMoves(this.currentPlayer, from);
            let ret = new Array<GameMove>();

            // for each move -- see if the board after the move will result in less capturables     
            for (let move of tempMoves) {
                let tempBoard = this.board.Clone();
                let fromCell = tempBoard.GetCellById(move.From);
                let toCell = tempBoard.GetCellById(move.To);

                var moveResult = tempBoard.RecordPlayerMove(fromCell, toCell);
                let result2 = tempBoard.HasCapturablePieces(this.currentPlayer, this.currentPlayer.IsAttacker ? this.defender : this.attacker);
                if (result2.capturables.length < result.capturables.length) {
                    // good move?
                    ret.push(move);
                }
                // delete tempBoard;
            }

            if (ret.length == 0) // 
                ret = tempMoves;

            return ret;
        }

        /**
        * identifies moves using unreachable pieces
        * @param from -- optional from location
        */
        public moves_unreachables(from: string = ""): Array<GameMove> {

            let ret = this.board.GetPossibleUnreachableMoves(this.currentPlayer, from);
            return ret;
        }

        /**
         * @returns all possible settings
         */
        public settings(): Array<string> {
            if (this.is_in_setting_state() == true)
                return this.board.GetPossibleSettings();
            else
                return new Array<string>();
        }

        /**
         * returns all possible settings near the malha
         */
        public settings_near_malha(): Array<string> {
            var ret = new Array<string>();

            let nearMalha = ['c4', 'e4', 'd3', 'd5'];
            for (let i = 0; i < nearMalha.length; i++) {
                let cell = this.board.GetCellById(nearMalha[i]);
                if (cell.IsEmpty())
                    ret.push(nearMalha[i]);
            }

            return ret;
        }

        /**
         * returns all possible settings close to the opponent of the current player
         */
        public settings_near_opponent(): Array<string> {
            return this.board.GetPossibleSettingsNearOpponent(this.currentPlayer);
        }

        /**
         * Checks if the current player still can set a piece
         */
        public is_current_player_setting(): boolean {
            if (this.state != GameState.Setting)
                return false;

            return this.numberOfSettingsAllowed > 0;
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
        public set(fen: string): boolean {
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

        public move_flags(): GameMoveFlags {
            return this.moveFlags;
        }

        /**
         * @summary Checks if the fen piece char is an Attacker or a Defender piece.
         * Defender pieces are in lower case.
         * @param piece - the piece code
         */
        private isDefenderPiece(piece: string): boolean {
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
        validFen(fen: string): boolean {
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
        public isInSettingMode(): boolean {
            return this.state === GameState.Setting;
        }

        /**
         * @returns the game id
         */
        public getGameId(): string {
            return this.id;
        }

        /**
         * @summary sets the game id
         * @param id  - the game id as set in storage
         */
        public setGameId(id: string): void {
            this.id = id;
        }



        /**
         * sets up the game with the given game state
         * @param serverGameState  -- the game state
         * @param delayAfterEachMove -- delay after making the move in msec
         */
        public setupWith(serverGameState: ServerGameState, delayAfterEachMove: number = 0): boolean {
            let ret = false;

            this.init();

            if (serverGameState.Status == GameStatus.Joined)
                this.state = GameState.Setting;

            // sort by the move number
            var sortedMoves = serverGameState.Moves.sort((a, b) => {
                // add check for dates
                if (a.Number > b.Number) {
                    return 1;
                }

                if (a.Number < b.Number) {
                    return -1;
                }
                return 0;
            });


            for (let move of serverGameState.Moves) {
                if (move.IsSetting) {

                    this.processSetting(move.To);
                }
            }

            for (let move of serverGameState.Moves) {
                if (!move.IsSetting) {
                    this.processMove(move.From, move.To, move.Resigned, move.ExchangeRequest);
                }
            }


            // check the players


            return ret;
        }

        /*
            private timedProcessMove(setting: boolean, moveFrom: string, moveTo: string, moveResigned: boolean, moveExchangeRequest: boolean) :boolean {
                
            } */

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
            if (this.state === GameState.Pending || this.state === GameState.Setting || this.state === GameState.Moving)
                return false;
            else
                return true;
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
         * Checks if the cell is valid and empty
         * @param cellId
         */
        public is_empty(cellId: string): boolean {
            let cell = this.board.GetCellById(cellId);
            if (cell!= null)
                return cell.IsEmpty();

            else
            {
                // console.log("");
                return false;
            }

        }
        /**
          * Checks if the cell is valid
          * @param cellId
          */
        public is_valid(cellId: string): boolean {
            let cell = this.board.GetCellById(cellId);
            if (cell != null)
                return true;
            else {
                 return false;
            }

        }

        /**
       * Checks if the cell is valid and occupied by current player
       * @param cellId
       */
        public is_occupied_current_player(cellId: string): boolean {
            let cell = this.board.GetCellById(cellId);
            if (cell != null)
                return cell.IsOccupiedBy(this.currentPlayer);
            else {
                return false;
            }

        }


        /**
         * checks the game status and issue the appropriate events
         */
        public check(): void {
            // checks the game status and generates
            this.checkPass();
            this.CheckScores();
        }

        /**
         * Checks if a specific piece is required to be moved
         */
        public move_source_required(): string {
            return this.moveSourceRequired;
        }

        /**
         * checks if the given destination is valid for the required piece
         * @param dest
         */
        public valid_move_destination(dest: string): boolean {
            if (this.moveDestinationsPossible == null || this.moveSourceRequired.length ==0)
                return true;
            if (this.moveDestinationsPossible.indexOf(dest) >= 0)
                return true;
            return false;

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

        public getAttackerMoveNumber(): number { return this.attackerMove; }
        public getDefenderMoveNumber(): number { return this.defenderMove; }

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
         * @param resigned - current player is indicating resigning
         * @param exchangeRequest - current player is indicating move as participating in an exchange request 
         */
        public processMove(fromCellId: string, toCellId: string, resigned: boolean, exchangeRequest: boolean): boolean {
            if (this.state != GameState.Moving)
                return false;

            let eventData = new GameEventData(this, this.getCurrentPlayer());

            this.moveFlags.resigned = resigned;
            // check resigned
            if (this.moveFlags.resigned) {

                if (eventData.player.IsAttacker()) {
                    //
                    this.winner = this.defender;
                    this.state = GameState.AttackerAbandoned;
                }
                else {
                    this.winner = this.attacker;
                    this.state = GameState.DefenderAbandoned;
                }

                eventData.player = this.winner; 
       

                this.gameEvents.winnerDeclaredEvent(eventData);

                return true;
            }
                   
            // check the possible moves  
            if (this.valid_move_destination(toCellId) === false)
                return false;

            let ret = false;
            let fromCell = this.board.GetCellById(fromCellId);
           
            // Not fromCell set yet
            if (fromCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.InvalidCellId, null, null, fromCellId);
                return ret;
            }
            
            // check if the piece selected is owned by the current player
            if (fromCell.IsOccupiedBy(this.getCurrentPlayer()) === false) {
                // Invalid piece selected (empty square or opponent piece)
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, fromCell, null,fromCellId);
                return ret;
            }
            // Check if the piece selected could actually move
            if (fromCell.IsSurrounded()) {
               this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedCellThatIsSurroundedForMoving, fromCell, null, fromCellId);
                return ret;
            }

            let toCell = this.board.GetCellById(toCellId);
            if (toCell == null) {

                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.InvalidCellId, fromCell, toCell,toCellId);
                return ret;
            }
            eventData.from = fromCell;
            eventData.to = toCell;
            eventData.targetCellId = toCell.ID();
            // de-selection move/canceling move from fromCell (could indicate piece exchange requests)
            if (fromCell === toCell) {
                
                this.gameEvents.newMoveCanceledEvent(eventData)

                // check if current player is confirming an exchange request with this move
              //  this.CheckUntouchableMoves(toCellId, exchangeRequest, eventData);
              //  ret = true;
                return ret;
            }

            let result = this.board.RecordPlayerMove(fromCell, toCell);
            if (result.status == PlayerMoveStatus.OK) {
                let move = new GameMove(fromCell.ID(), toCell.ID(), this.currentPlayer);
                this.history.AddMove(this.currentPlayer, fromCell.ID(), toCell.ID());
              
                ret = true;

                // check if current player is defender confirming an requesting exchange request with this move
                this.CheckUntouchableMoves(toCellId, exchangeRequest,eventData);
                if (this.currentPlayer.IsAttacker()) {
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
                if (result.capturedPieces == 0) {
                    // The move is completed with no capture
                    // Check untouchable exchange requests
                    ///todo fix this function checkUntouchables
                    //this.CheckUntouchableMoves(move);
                    eventData.targetCellId = toCellId;
                    this.gameEvents.newMoveCompletedEvent(eventData);
                    this.PlayerChangeTurn();
                    
                }
                else {   // Update the scores
                    if (this.currentPlayer.IsAttacker()) {
                        this.defenderScore -= result.capturedPieces;
                    }
                    else {
                        this.attackerScore -= result.capturedPieces;
                    }

                    // check if the player could still 
                    let stillHavePiecesToCaptureResult = this.board.StillHavePiecesToCapture(toCell);
                    if (stillHavePiecesToCaptureResult.status === false) {
                        eventData.targetCellId = toCellId;
                        this.gameEvents.newMoveCompletedEvent(eventData)
                        this.PlayerChangeTurn();
                        
                    }
                    else {
                        eventData.targetCellId = toCell.ID();
                        this.moveSourceRequired = toCell.ID();
                        this.moveDestinationsPossible = stillHavePiecesToCaptureResult.possibleMoves;
                        // add event that player should continue to play since they could still capture                       
                        this.gameEvents.newMoveCompletedContinueSamePlayerEvent(eventData)
                    }
   
                }
                //Check the scores 
                this.CheckScores();
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
                this.firstMove = true;
                this.currentPlayer = this.attacker;   // attackers start after finishing the game
                // check game options here if defender is to start

                // SettingsCompletedEvent(this, null);
                var eventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);
            }
        }

        /**
         * @summary checks if the current player can not move and issue a player
         * @events playerPassed
         */
        private checkIfPlayerCanNotMove(): void {
            var eventData = new GameEventData(this, this.getCurrentPlayer());
            // check if the player can actually move
            if (this.state != GameState.Setting && this.CheckIfCurrentPlayerCanPassTurn() === true) {

                // reset to the previous player
                if (this.currentPlayer.IsAttacker())
                    this.currentPlayer = this.defender;
                else
                    this.currentPlayer = this.attacker;

                this.gameEvents.playerPassedEvent(eventData);
            }
        }

        /**
         * Change players turns after a move
         */
        private PlayerChangeTurn(): void {
          
            if (this.currentPlayer.IsAttacker())
                this.currentPlayer = this.defender;
            else
                this.currentPlayer = this.attacker;

            this.moveSourceRequired = "";
            

            var eventData = new GameEventData(this, this.getCurrentPlayer());
            // check if the player can actually move
            if (this.state == GameState.Moving) {
                if (this.currentPlayerIsBlocked() === true) {
                    if (this.currentPlayer.IsAttacker())
                        this.state = GameState.AttackerCanNotMove;   // after the first move
                    else
                        this.state = GameState.DefenderCanNotMove;

                    // check if this happened on the first move
                    if (this.firstMove) {
                        // declare defender as winner and end the game
                        this.winner = this.defender;



                        eventData.player = this.winner;
                        this.state = GameState.WinnerDeclaredDefenderIsBlocked;
                        this.gameEvents.winnerDeclaredEvent(eventData);
                        return;
                    } else {

                        this.gameEvents.playerPassedEvent(eventData);

                        this.state = GameState.Moving;
                        // change player's again
                        this.PlayerChangeTurn();
                        return;
                    }
                } 

                if (this.firstMove === true)
                    this.firstMove = false;
            }
          
            // 
            this.gameEvents.newPlayerTurnEvent(eventData);
        }

        /**
         * processes that current player abandoned
         */
        private processCurrentPlayerAbandoned() {
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

        private CheckScores(): void {
            if (this.defenderScore <= 0) {
                this.winner = this.attacker;
                this.state = GameState.DefenderLostAllPieces;

                var eventData = new GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            }
            else {
                if (this.attackerScore <= 0) {
                    this.state = GameState.AttackerLostAllPieces;
                    this.winner = this.defender;

                    var eventData = new GameEventData(this, this.winner);
                    this.gameEvents.winnerDeclaredEvent(eventData);
                }
            }
        }

        /**
         * @summary  Pass by an attacker usually indicates that the attacker likes the defender to 
         *  show an untouchable piece that demands a two exchange.
         * The defender generally passes while demanding exchanges for his/her untouchables/unreachable pieces
         */
        private checkPass(): boolean {
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
        private CheckIfCurrentPlayerCanPassTurn(): boolean {
            let possibleMoves = this.board.GetPossibleMoves(this.currentPlayer);
            if (possibleMoves.length == 0)
                return true;
            else
                return false;
        }

        /**
        * @summary Checks if the current player is blocked --- does not have any possible moves
        */
        private currentPlayerIsBlocked(): boolean {
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
        private recordSetting(cellId: string): boolean {
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
                eventData.targetCellId = cell.ID();
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
         * @returns true if the game is in setting phase
         */
        public is_in_setting_state(): boolean {
            return this.state == GameState.Setting;
        }

        /**
         * Checks if the selected piece to drag is able to move
         * @param selectedPieceId
         */
        public is_surrounded_piece(selectedPieceId: string): boolean {
            let clickedCell = this.board.GetCellById(selectedPieceId);

            return clickedCell.IsSurrounded();
        }

        /**
         * Checks untouchable cases and updates the move flags 
         * @param targetCellId 
         * @param moveExchangeRequest
         * @param eventData
         */
        private CheckUntouchableMoves(targetCellId: string, moveExchangeRequest: boolean, eventData: GameEventData): void {
     
            // check player
            if (this.currentPlayer.IsDefender()) {
                
                // case defender turned off exchange request
                if (moveExchangeRequest == false) {
                    
                    this.moveFlags.exchangeRequestDefenderPiece = '';
                    this.moveFlags.exchangeRequestAccepted = false;
                    this.moveFlags.exchangeRequestAttackerPiece1 = '';
                    this.moveFlags.exchangeRequestAttackerPiece2 = ''
                    if (this.moveFlags.exchangeRequest) {  // cancel if a previous exchange request was set
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
                    if (this.moveFlags.exchangeRequest == false) {
                        // case not previous exchange request was indicated    
                        this.moveFlags.exchangeRequest = moveExchangeRequest;  
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                        return;
                    }
                    else { // case a previous exchange request was indicated
                        this.moveFlags.exchangeRequest = moveExchangeRequest;                       
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);

                        /// to-do: add a check if it is the same a the previous selected piece
                        if (this.moveFlags.exchangeRequestAccepted && this.moveFlags.exchangeRequestAttackerPiece1 != ''
                            && this.moveFlags.exchangeRequestAttackerPiece2 != '') {
                            let result = this.ProcessUntouchableTwoExchange(this.moveFlags.exchangeRequestDefenderPiece,
                                this.moveFlags.exchangeRequestAttackerPiece1, this.moveFlags.exchangeRequestAttackerPiece2);

                            if (result == true) {
                                //
                                this.gameEvents.untouchableExchangeCompletedEvent(eventData);
                                // reset the flags after posting the event
                                this.moveFlags.reset();
                                return;
                            }
                        }
                    }                                    
                }
            }
            else { 
                // is attacker
                // case attacker turned off exchange request accepted
                if (moveExchangeRequest === false) {
                  
                    this.moveFlags.exchangeRequestAttackerPiece1 = '';
                    this.moveFlags.exchangeRequestAttackerPiece2 = ''
                    this.moveFlags.exchangeRequestDefenderPiece = '';
                    if (this.moveFlags.exchangeRequest || this.moveFlags.exchangeRequestAccepted) {  // cancel if a previous exchange request was set
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

                    if (this.moveFlags.exchangeRequestAttackerPiece1 != '') {
                        this.moveFlags.exchangeRequestAttackerPiece2 = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                    }
                    else {
                        this.moveFlags.exchangeRequestAttackerPiece1 = targetCellId;
                        
                        this.gameEvents.untouchableSelectedEvent(eventData);
                    }

                }
            }
        }


        /** @summary Processes a request to exchange a defender piece with two of the attacker pieces
         *
         * @param untouchablePieceId - the id of the defender piece to exchange
         * @param attackerPiece1 - the id of the attacker's 1st piece to exchange
         * @param attackerPiece2 - the id of the attacker's 2nd piece to exchange
        */
        private ProcessUntouchableTwoExchange(untouchablePieceId: string, attackerPiece1: string, attackerPiece2: string) : boolean{
            //steps:
            // - check if the defender piece is able to move and is not reachable
            // - check if the attacker pieces can move freely
            // if OK allow the exchange, other generate an error message using events
            var ret = this.board.RecordExchange(untouchablePieceId, attackerPiece1, attackerPiece2);

            if (ret === true) {
                this.defenderScore--;
                this.attackerScore--;
                this.attackerScore--;
            }

            return ret; 
        }
    }
}