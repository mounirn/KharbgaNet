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

        // starting with 24 pieces.
        numberOfSettingsAllowed = 2; // temp counter used for Settings. Players are allowed to set two pieces at a time
        attackerScore = 0;
        defenderScore = 0;
        attackerMove = 0;
        defenderMove = 0;

        // transitional state
        moveSourceRequiredAfterCapture: string = ""; // the source piece required after a capture
        moveDestinationsPossibleCapture: string[] = null; // the possible destinations to capture
        firstMove = true;
        moveFlags: GameMoveFlags; // current state of the move params

        /*
         * @summary Initializes the game to the no started state
         */
        constructor(gameEvents: IGameEvents, boardEvents: IBoardEvents) {
            this.state = GameState.NotStarted;

            this.gameEvents = gameEvents;
            this.boardEvents = boardEvents;

            this.board = new Board(boardEvents);
            this.moveFlags = new GameMoveFlags();

        }
        /**
         * @summary - initializes the game
         */
        init(): void {
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
         * @summary Starts a new game between two players on the same computer
         */
        public start(): void {
            this.init();
            this.reset();

            var eventData: GameEventData = new GameEventData(this, this.getCurrentPlayer());
            this.gameEvents.newGameStartedEvent(eventData);
            this.gameEvents.newPlayerTurnEvent(eventData);
        }

        /**
         * @summary Resets the game. Clears the board and players info
         */
        public reset(): void {
            this.board.clear();
            this.attacker.reset();
            this.defender.reset();
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.winner = null;
            this.currentPlayer = this.attacker;
        }

        /**
         * Identifies all possible moves
         * @returns all possible moves for the current player
         */
        public moves(from: string = ""): GameMove[] {
            return this.board.getPossibleMoves(this.currentPlayer, from);
        }

        /**
         * identifies moves that result in a capture of one of the opponent pieces
         * @param from -- optional from location
         */
        public moves_that_capture(from: string = ""): GameMove[] {
            var temp: GameMove[] = this.board.getPossibleMoves(this.currentPlayer, from);

            var ret: GameMove[] = new Array<GameMove>();
            for (let move of temp) {
                // check if the from cell could capture
                var fromCell: BoardCell = this.board.getCellById(move.from);
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
        }

        /**
         * @summary Identifies moves by capturable pieces (hopefully to save)
         * @param from - the from cell position
         * @returns - the possible moves
         */
        public moves_by_capturables(from: string = ""): Array<GameMove> {
            var temp: GameMove[] = this.board.getPossibleMoves(this.currentPlayer, from);

            var ret:GameMove[] = new Array<GameMove>();
            for (let move of temp) {
                var capturable:boolean = this.board.isCapturable(this.currentPlayer, move.from);
                if (capturable) {
                    ret.push(move);
                }
            }
            return ret;
        }
        /**
         * Identifies moves that result in saving own pieces
         * @param from -- optional from location
         */
        public moves_that_save(from: string = ""): GameMove[] {

            let result = this.board.hasCapturablePieces(this.currentPlayer,
                this.currentPlayer.isAttacker() ? this.defender : this.attacker);

            let tempMoves: GameMove[] = this.board.getPossibleMoves(this.currentPlayer, from);
            let ret: GameMove[] = new Array<GameMove>();

            // for each move -- see if the board after the move will result in less capturables
            for (let move of tempMoves) {
                let tempBoard: Board = this.board.clone();
                let fromCell: BoardCell = tempBoard.getCellById(move.from);
                let toCell: BoardCell = tempBoard.getCellById(move.to);

                var moveResult = tempBoard.RecordPlayerMove(fromCell, toCell);
                let result2 = tempBoard.hasCapturablePieces(this.currentPlayer,
                    this.currentPlayer.isAttacker() ? this.defender : this.attacker);
                if (result2.capturables.length < result.capturables.length) {
                    // good move?
                    ret.push(move);
                }
                // delete tempBoard;
            }

            if (ret.length === 0) {
                ret = tempMoves;
            }
            return ret;
        }

        /**
         * @summary Identifies moves using unreachable pieces
         * @param from -- optional from location
         */
        public moves_unreachables(from: string = ""): GameMove[] {

            return this.board.GetPossibleUnreachableMoves(this.currentPlayer, from);
        }

        /**
         * @summary Searches for all possible settings for the game
         * @returns all possible settings
         */
        public settings(): string[] {
            if (this.is_in_setting_state() === true) {
                return this.board.getPossibleSettings();
            } else {
                return [];
            }
        }

        /**
         * Updates the game player names
         * @param attacker - name
         * @param defender - name
         */
        public setPlayerNames(attacker: string, defender: string): void {
            this.attacker.name = attacker;
            this.defender.name = defender;
        }
        /**
         * @summary Searches for possible settings near the opening square
         * @returns all possible settings near the malha
         */
        public settings_near_malha(): Array<string> {
            var ret : string[]= new Array<string>();

            let nearMalha: string[] = ["c4", "e4", "d3", "d5"];
            for (let i: number = 0; i < nearMalha.length; i++) {
                let cell: BoardCell = this.board.getCellById(nearMalha[i]);
                if (cell.isEmpty()) {
                    ret.push(nearMalha[i]);
                }
            }
            return ret;
        }

        /**
         * @summary Searches for all possible settings near opponent pieces
         * @returns all possible settings close to the opponent of the current player
         */
        public settings_near_opponent(): string[] {
            return this.board.getPossibleSettingsNearOpponent(this.currentPlayer);
        }

        /**
         * @summary Checks if the current player still can set a piece
         * @returns true if the current player can still set
         */
        public is_current_player_setting(): boolean {
            if (this.state !== GameState.Setting) {
                return false;
            }

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
         * @returns true if valid and successful to parse
         */
        public set(fen: string): boolean {
            if (this.validFen(fen) !== true) {
                return false;
            }

            // cut off any move, castling, etc info from the end
            // we're only interested in position information
            fen = fen.replace(/ .+$/, "");

            var rows: string[] = fen.split("/");
            var position = {};

            var currentRow: number = 7;
            for (var i: number = 0; i < 7; i++) {
                var row: string[] = rows[i].split("");
                var colIndex: number = 0;

                // loop through each character in the FEN section
                for (var j: number = 0; j < row.length; j++) {
                    // number / empty squares
                    if (row[j].search(/[1-7]/) !== -1) {
                        var emptySquares: number = parseInt(row[j], 10);
                        colIndex += emptySquares;
                    } else {  // piece
                        var square:string = BoardCell.COLUMNS[colIndex] + currentRow;
                        var isAttackerPiece: boolean = this.isDefenderPiece(row[j]) === false;

                        var result:PlayerSettingStatus = this.board.recordPlayerSetting(square, isAttackerPiece);
                        if (result !== PlayerSettingStatus.OK) {
                            //
                            console.log("Error loading fen: " + fen + " at square: " + square);
                            return false;
                        } else {
                            if (isAttackerPiece) {
                                this.attackerScore++;
                            } else {
                                this.defenderScore++;
                            }
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
            if (piece.toLowerCase() === piece) {
                return true;
            } else {
                return false;
            }
        }
        /**
         * @summary Checks if the give game fen string is valid or not
         * @param fen - the fen string
         */
        public validFen(fen: string): boolean {
            // todo: this whole function could probably be replaced with a single regex
            if (typeof fen !== "string") {
                 return false;
            }

            // cut off any move, castling, etc info from the end
            // we're only interested in position information
            fen = fen.replace(/ .+$/, "");

            var chunks: string[] = fen.split("/"); // fen should be 7 sections separated by slashes
            if (chunks.length !== 7) {
                 return false;   // should be only 7 rows
            }
            // check the piece sections
            for (var i: number = 0; i < 7; i++) {
                if (chunks[i] === "" ||
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
         * @summary Sets up the game with the given game state. Replays all moves sorted by number
         * @param serverGameState  -- the game state as stored including all moves
         * @param delayAfterEachMove -- delay after making the move in msec
         * @returns true if successful, false otherwise
         */
        public setupWith(serverGameState: ServerGameState, delayAfterEachMove: number = 0): boolean {
            let ret:boolean = false;

            this.init();

            if (serverGameState.status === GameStatus.Joined) { // set the game state to setting
                this.state = GameState.Setting;
            }
            // sort by the move number
            var sortedMoves: GameMove[] = serverGameState.moves.sort((a, b) => {
                // add check for dates
                if (a.number > b.number) {
                    return 1;
                }

                if (a.number < b.number) {
                    return -1;
                }
                return 0;
            });


            for (let move of sortedMoves) {
                if (move.isSetting) {
                    this.processSetting(move.to);
                }
            }

            for (let move of sortedMoves) {
                if (!move.isSetting) {
                    this.processMove(move.from, move.to, move.resigned, move.exchangeRequest);
                }
            }

            // check the players
            return ret;
        }

        /**
         * @returns the game state see GameState doc
         */
        public getState(): GameState { return this.state; }

        /**
         * @summary indicates whether the game is done or not
         * @returns true if the game is over in any of the possible game over cases
         */
        public game_over(): boolean {
            if (this.state === GameState.Pending || this.state === GameState.Setting || this.state === GameState.Moving){
                return false;
            } else {
                return true;
            }
        }
        /**
         * @summary indicates whether the game is done or not
         */
        public game_setting_over(): boolean {
            if (this.state === GameState.Setting) {
                return false;
            } else {
                return true;
            }
        }

        /**
         * @summary Identifies who's turn it is to play
         * @returns 'a' if attacker, 'd' if defender
         */
        public turn(): string {
            if (this.currentPlayer == null) {return ""; }
            if (this.currentPlayer.isAttacker()) { return "a";} else {return "d";}
        }

        /**
         * @summary Checks if the cell is valid and empty
         * @param cellId - the game cell to check
         * @returns true if a valid cell and is empty, false otherwise
         */
        public is_empty(cellId: string): boolean {
            let cell: BoardCell = this.board.getCellById(cellId);
            if (cell=== null) { return false; } else {
                return cell.isEmpty();
            }
        }
        /**
         * @summary Checks if the cell is valid
         * @param cellId - the id of the cell to check
         * @returns true if the cell if valid, false otherwise
         */
        public is_valid(cellId: string): boolean {
            let cell: BoardCell  = this.board.getCellById(cellId);
            if (cell === null) {return false;} else { return true; }
        }

        /**
         * @summary Checks if the move is valid for the current player
         * @param from the id of the cell moving from
         * @param to the id of the cell to move to
         * @returns true if a valid move, false otherwise
         */
        public valid_move(from: string, to: string): boolean {
            let fromCell: BoardCell = this.board.getCellById(from);
            if (fromCell == null) { return false;}

            if (!fromCell.isOccupiedBy(this.currentPlayer)) { return false;}

            let toCell: BoardCell = this.board.getCellById(to);
            if (toCell == null) {  return false;}

            if (!toCell.isAdjacentTo(fromCell)) {
                return false;
            }
            if (!toCell.isEmpty()) {
                return false;
            }
            return true;
        }

        /**
         * @summary Checks if the cell is valid and occupied by current player
         * @param cellId the id of the cell to check
         * @returns true if occupied by the current player, false otherwise
         */
        public is_occupied_current_player(cellId: string): boolean {
            let cell: BoardCell = this.board.getCellById(cellId);
            if (cell !== null) {
                return cell.isOccupiedBy(this.currentPlayer);
            } else {
                return false;
            }
        }

        /**
         * @summary checks the game status and issue the appropriate events
         */
        public check(): void {
            // checks the game status and generates
            this.checkPass();
            this.CheckScores();
        }

        /**
         * @summary Checks if a specific piece is required to be moved
         */
        public move_source_required(): string {
            return this.moveSourceRequiredAfterCapture;
        }

        /**
         * @summary checks if the given destination is valid for the required piece
         * @param dest - the id of the cell moving to
         * @returns true if a valid destination, false otherwise
         */
        public checkMoveSourceRequiredAndValidDestinations(dest: string): boolean {
            if (this.moveDestinationsPossibleCapture == null ||  this.moveSourceRequiredAfterCapture == null ||
                this.moveSourceRequiredAfterCapture.length ===0) {
                return true;
            }
            if (this.moveDestinationsPossibleCapture.indexOf(dest) >= 0) {
                return true;
            }
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

        /**
         * @summary Checks the time since the start of the game
         */
       // public TimeSpan timeSinceStartup { return DateTime.Now - _startTime; } }

        /**
         * @summary Checks the game is the winner id defined or not
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
         * @param s - the spectator to add
         */
        addSpectator(s: Player): void {
            this.spectators.push(s);
        }

        /**
         * @returns the internal board representation
         */
        public Board(): Board { return this.board; }

        /**
         * @summary process a player setting
         * @param cellId - the cell id clicked/selected by the user
         * @returns true if a successful setting, false otherwise
         */
        public processSetting(cellId: string): boolean {
                return this.recordSetting(cellId);
        }

        /**
         * @summary Acts on the user requested move from one cell to another
         * @param fromCellId - the cell id of the from cell
         * @param toCellId - the cell id of the to cell
         * @param resigned - current player is indicating resigning
         * @param exchangeRequest - current player is indicating move as participating in an exchange request
         * @returns true if successful, false otherwise
         */
        public processMove(fromCellId: string, toCellId: string, resigned: boolean, exchangeRequest: boolean): boolean {
            if (this.state !== GameState.Moving) {
                return false;
            }

            let eventData: GameEventData  = new GameEventData(this, this.getCurrentPlayer());

            this.moveFlags.resigned = resigned;
            // check resigned with the move
            if (this.moveFlags.resigned) {
                this.processCurrentPlayerAbandoned();
                if (eventData.player.isAttacker()) {
                    //
                    this.winner = this.defender;
                    this.state = GameState.AttackerAbandoned;
                } else {
                    this.winner = this.attacker;
                    this.state = GameState.DefenderAbandoned;
                }
                eventData.player = this.winner;
                this.gameEvents.winnerDeclaredEvent(eventData);
                return true;
            }
            // check the possible moves if a source if required
            if (this.checkMoveSourceRequiredAndValidDestinations(toCellId) === false) {
                 return false;
            }

            let ret: boolean = false;
            let fromCell: BoardCell = this.board.getCellById(fromCellId);
            if (fromCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.InvalidCellId, null, null, fromCellId);
                return ret;
            }
            // check if the piece selected is owned by the current player
            if (fromCell.isOccupiedBy(this.getCurrentPlayer()) === false) {
                // invalid piece selected (empty square or opponent piece)
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedEmptyOrOpponentPieceForMoving, fromCell, null,fromCellId);
                return ret;
            }
            // check if the piece selected could actually move
            if (fromCell.isSurrounded()) {
               this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.SelectedCellThatIsSurroundedForMoving, fromCell, null, fromCellId);
                return ret;
            }

            let toCell: BoardCell = this.board.getCellById(toCellId);
            if (toCell == null) {
                this.board.RaiseBoardInvalidMoveEvent(BoardMoveType.InvalidCellId, fromCell, toCell,toCellId);
                return ret;
            }
            eventData.from = fromCell;
            eventData.to = toCell;
            eventData.targetCellId = toCell.ID();
            // de-selection move/canceling move from fromCell (could indicate piece exchange requests)
            if (fromCell === toCell) {
                this.gameEvents.newMoveCanceledEvent(eventData);
                return ret;
            }

            let result = this.board.RecordPlayerMove(fromCell, toCell);
            if (result.status === PlayerMoveStatus.OK) {
                let move: GameMove = new GameMove(fromCell.ID(), toCell.ID(), this.currentPlayer);
                this.history.AddMove(this.currentPlayer, fromCell.ID(), toCell.ID());
                ret = true;

                // check if current player is defender confirming an requesting exchange request with this move
                this.checkUntouchableMoves(toCellId, exchangeRequest,eventData);
                if (this.currentPlayer.isAttacker()) {
                    this.attackerMove++;
                } else {
                    this.defenderMove++;
                }
                //
                // 1. If the last move captured no pieces, player must change turn change turn
                // 2. If the last move captured 1 or more pieces and the same piece can continue to move and
                //    capture more pieces, the player must continue moving and capturing the opponent pieces
                //    until there are no more pieces to capture.
                //
                if (result.capturedPieces === 0) {
                    // the move is completed with no capture
                    // check untouchable exchange requests
                    /// todo fix this function checkUntouchables
                    // this.CheckUntouchableMoves(move);
                    eventData.targetCellId = toCellId;
                    this.gameEvents.newMoveCompletedEvent(eventData);
                    this.checkPlayerTurn();
                } else {   // update the scores
                    if (this.currentPlayer.isAttacker()) {
                        this.defenderScore -= result.capturedPieces;
                    } else {
                        this.attackerScore -= result.capturedPieces;
                    }

                    // check if the player could still
                    let stillHavePiecesToCaptureResult = this.board.StillHavePiecesToCapture(toCell);
                    if (stillHavePiecesToCaptureResult.status === false) {
                        eventData.targetCellId = toCellId;
                        this.gameEvents.newMoveCompletedEvent(eventData);
                        this.moveDestinationsPossibleCapture = null;
                        this.moveSourceRequiredAfterCapture = "";
                        this.checkPlayerTurn();
                    } else {
                        eventData.targetCellId = toCell.ID();
                        this.moveSourceRequiredAfterCapture = toCell.ID();
                        this.moveDestinationsPossibleCapture = stillHavePiecesToCaptureResult.possibleMoves;
                        // add event that player should continue to play since they could still capture
                        this.gameEvents.newMoveCompletedContinueSamePlayerEvent(eventData);
                    }
                }
                // check the scores and raise any possible events
                this.CheckScores();
            } else {
                eventData.move_status = result.status;
                this.gameEvents.invalidMoveEvent(eventData);
            }

            return ret;
        }

        /**
         * @summary  handler with call back when the move processing is completed
         * @param move the move to process
         * @param moveHandler the event handle for callback
         */
        public processMove2(move: GameMove, moveHandler: IGameEvents): boolean {
            var ret: boolean = this.processMove(move.from, move.to, move.resigned, move.exchangeRequest);

            moveHandler.moveProcessed(ret, move);
            return ret;
        }


        /**
         * @summary Checks if setting phase if completed
         * @returns true if the board is ready to start 2nd phase after setting
         */
        private checkIfSettingsCompleted(): void {
            if (this.board.allPiecesAreSet()) {
                this.state = GameState.Moving;
                this.firstMove = true;
                this.currentPlayer = this.attacker;   // attackers start after finishing the game
                // check game options here if defender is to start

                // settingsCompletedEvent(this, null);
                var eventData: GameEventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.settingsCompletedEvent(eventData);
            }
        }

        /**
         * @summary Change players turns after a move
         */
        private checkPlayerTurn(): void {
            if (this.currentPlayer.isAttacker()) {
                this.currentPlayer = this.defender;
            } else {
                this.currentPlayer = this.attacker;
            }

            this.moveSourceRequiredAfterCapture = "";
            this.moveDestinationsPossibleCapture = null;

            var eventData: GameEventData = new GameEventData(this, this.getCurrentPlayer());
            // check if the player can actually move
            if (this.state === GameState.Moving) {
                if (this.currentPlayerIsBlocked() === true) {
                    if (this.currentPlayer.isAttacker()) {
                        this.state = GameState.AttackerCanNotMove;   // after the first move
                    } else {
                        this.state = GameState.DefenderCanNotMove;
                    }
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
                        this.checkPlayerTurn();
                        return;
                    }
                }

                if (this.firstMove === true) {
                    this.firstMove = false;
                }
            }
            this.gameEvents.newPlayerTurnEvent(eventData);
        }

        /**
         * @summary processes that current player abandoned
         * @event  Winner Declared Event
         */
        private processCurrentPlayerAbandoned(): void {
            if (this.currentPlayer === this.attacker) {
                this.state = GameState.AttackerAbandoned;
                this.winner = this.defender;
            } else {
                this.state = GameState.DefenderAbandoned;
                this.winner = this.attacker;
            }

            // winnerDeclaredEvent(this, null);
            var eventData: GameEventData = new GameEventData(this, this.winner);
            this.gameEvents.winnerDeclaredEvent(eventData);
        }

        private CheckScores(): void {
            if (this.defenderScore <= 0) {
                this.winner = this.attacker;
                this.state = GameState.DefenderLostAllPieces;

                var eventData: GameEventData = new GameEventData(this, this.winner);
                this.gameEvents.winnerDeclaredEvent(eventData);
            } else {
                if (this.attackerScore <= 0) {
                    this.state = GameState.AttackerLostAllPieces;
                    this.winner = this.defender;

                    var eventData2: GameEventData = new GameEventData(this, this.winner);
                    this.gameEvents.winnerDeclaredEvent(eventData2);
                }
            }
        }

        /**
         * @summary  Pass by an attacker usually indicates that the attacker likes the defender to 
         *  show an untouchable piece that demands a two exchange.
         * The defender generally passes while demanding exchanges for his/her untouchables/unreachable pieces
         */
        private checkPass(): boolean {
            let bCanPass: boolean = this.checkIfCurrentPlayerCanPassTurn();

            // raise an event a new player move
            if (bCanPass) {
                // add check to see if it is OK for the player to pass
                if (this.currentPlayer.isAttacker()) {
                    this.currentPlayer = this.defender;
                } else {
                    this.currentPlayer = this.attacker;
                }

                var eventData: GameEventData = new GameEventData(this, this.getCurrentPlayer());
                this.gameEvents.newPlayerTurnEvent(eventData);
            }
            return bCanPass;
        }

        /**
         * @summary Checks if the current player can pass --- does not have any possible moves
         */
        private checkIfCurrentPlayerCanPassTurn(): boolean {
            let possibleMoves: GameMove[] = this.board.getPossibleMoves(this.currentPlayer);
            if (possibleMoves.length === 0) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @summary Checks if the current player is blocked --- does not have any possible moves
         */
        private currentPlayerIsBlocked(): boolean {
            let possibleMoves: GameMove[] = this.board.getPossibleMoves(this.currentPlayer);
            if (possibleMoves.length === 0) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @summary Records the current player request to set a piece. In order for a setting to be accepted, the
         * following conditions need to be met
         * @param cellId the id of a valid cell
         * @returns true if successful move. false otherwise
         */
        private recordSetting(cellId: string): boolean {
            if (this.state !== GameState.Setting) {
                return false;
            }

            let recorded: PlayerSettingStatus = this.board.recordPlayerSetting(cellId, this.getCurrentPlayer().isAttacker());
            if (recorded === PlayerSettingStatus.OK) {
                let cell: BoardCell = this.board.getCellById(cellId);
                this.numberOfSettingsAllowed--;
                this.history.AddSetting(this.currentPlayer, cell.ID());

                if (this.getCurrentPlayer().isAttacker() === true){
                    this.attackerScore++;
                } else{
                    this.defenderScore++;
                }
                var eventData: GameEventData = new GameEventData(this, this.getCurrentPlayer());
                eventData.from = cell;
                eventData.to = cell;
                eventData.targetCellId = cell.ID();
                this.gameEvents.newSettingCompletedEvent(eventData);

                if (this.numberOfSettingsAllowed === 0) {
                    this.numberOfSettingsAllowed = 2;
                    this.checkPlayerTurn();
                }
                this.checkIfSettingsCompleted();
            } else {
                // create an invalid setting event
                var eventData2: GameEventData = new GameEventData(this, this.getCurrentPlayer());
                let cell: BoardCell = this.board.getCellById(cellId);
                eventData2.targetCellId = cellId;
                eventData2.from = cell;
                eventData2.to = cell;
                if (recorded === PlayerSettingStatus.ERR_MALHA) {
                    this.gameEvents.invalidSettingMalhaEvent(eventData);
                } else {
                    if (recorded === PlayerSettingStatus.ERR_OCCUPIED) {
                        this.gameEvents.invalidSettingOccupiedEvent(eventData);
                    }
                }
            }
            return recorded === PlayerSettingStatus.OK;
        }

        /**
         * @summary Checks the game state
         * @returns true if the game is in moving phase, false otherwise
         */
        public is_in_moving_state(): boolean {
            return this.state === GameState.Moving;
        }

        /**
         * @summary Checks the game state
         * @returns true if the game is in setting phase, false otherwise
         */
        public is_in_setting_state(): boolean {
            return this.state === GameState.Setting;
        }

        /**
         * @summary Checks if the selected piece to drag is able to move
         * @param selectedPieceId - the id of the piece to check
         */
        public is_surrounded_piece(selectedPieceId: string): boolean {
            let clickedCell: BoardCell = this.board.getCellById(selectedPieceId);
            if (clickedCell === null) {
                return false;
            }
            return clickedCell.isSurrounded();
        }

        /**
         * @summary Checks untouchable cases and updates the move flags
         * @param targetCellId - the id of the cell to check
         * @param moveExchangeRequest
         * @param eventData
         */
        private checkUntouchableMoves(targetCellId: string, moveExchangeRequest: boolean, eventData: GameEventData): void {
            // check player
            if (this.currentPlayer.isDefender()) {
                // case defender turned off exchange request
                if (moveExchangeRequest === false) {
                    this.moveFlags.exchangeRequestDefenderPiece = "";
                    this.moveFlags.exchangeRequestAccepted = false;
                    this.moveFlags.exchangeRequestAttackerPiece1 = "";
                    this.moveFlags.exchangeRequestAttackerPiece2 = "";
                    if (this.moveFlags.exchangeRequest) {  // cancel if a previous exchange request was set
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.gameEvents.untouchableExchangeCanceledEvent(eventData);
                    } else {
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                    }

                    return;
                } else {
                    // case defender is requesting an exchange request (first time after reset)
                    if (this.moveFlags.exchangeRequest === false) {
                        // case not previous exchange request was indicated
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                        return;
                    } else { // case a previous exchange request was indicated
                        this.moveFlags.exchangeRequest = moveExchangeRequest;
                        this.moveFlags.exchangeRequestDefenderPiece = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);

                        /// to-do: add a check if it is the same a the previous selected piece
                        if (this.moveFlags.exchangeRequestAccepted && this.moveFlags.exchangeRequestAttackerPiece1 != ''
                            && this.moveFlags.exchangeRequestAttackerPiece2 !== "") {
                            let result:boolean = this.processUntouchableTwoExchange(this.moveFlags.exchangeRequestDefenderPiece,
                                this.moveFlags.exchangeRequestAttackerPiece1, this.moveFlags.exchangeRequestAttackerPiece2);

                            if (result === true) {
                                //
                                this.gameEvents.untouchableExchangeCompletedEvent(eventData);
                                // reset the flags after posting the event
                                this.moveFlags.reset();
                                return;
                            }
                        }
                    }
                }
            } else {
                // is attacker
                // case attacker turned off exchange request accepted
                if (moveExchangeRequest === false) {
                    this.moveFlags.exchangeRequestAttackerPiece1 = "";
                    this.moveFlags.exchangeRequestAttackerPiece2 = "";
                    this.moveFlags.exchangeRequestDefenderPiece = "";
                    if (this.moveFlags.exchangeRequest || this.moveFlags.exchangeRequestAccepted) {
                          // cancel if a previous exchange request was set
                        this.moveFlags.exchangeRequestAccepted = moveExchangeRequest;
                        this.gameEvents.untouchableExchangeCanceledEvent(eventData);
                    } else {
                        this.moveFlags.exchangeRequestAccepted = moveExchangeRequest;
                    }
                    return;
                } else {
                    // attacker is accepting the exchange request
                    this.moveFlags.exchangeRequestAccepted = true;

                    if (this.moveFlags.exchangeRequestAttackerPiece1 !== "") {
                        this.moveFlags.exchangeRequestAttackerPiece2 = targetCellId;
                        this.gameEvents.untouchableSelectedEvent(eventData);
                    } else {
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
        private processUntouchableTwoExchange(untouchablePieceId: string, attackerPiece1: string, attackerPiece2: string): boolean {
            // steps:
            // - check if the defender piece is able to move and is not reachable
            // - check if the attacker pieces can move freely
            // if OK allow the exchange, other generate an error message using events
            var ret:boolean = this.board.recordExchange(untouchablePieceId, attackerPiece1, attackerPiece2);

            if (ret === true) {
                this.defenderScore--;
                this.attackerScore--;
                this.attackerScore--;
            }
            return ret;
        }
    }
}