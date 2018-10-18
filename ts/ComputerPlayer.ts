namespace Kharbga {
     export class ComputerPlayer {

        public static SETTINGS_NEAR_MALHA: string[] = ["c4", "e4", "d3", "d5"];

        private generateSetting(aGame: Game, playOptions: IGamePlayOptions): AnalysedGameMove {
            var ret: AnalysedGameMove = new AnalysedGameMove();
            let settings: string[] = [];
            let currentPlayer: Player = aGame.getCurrentPlayer();
            if (currentPlayer === null) {
                ret.ok = false;
                ret.error = "Unknown current player";
                return ret;
            }
            if (playOptions.firstSettingMustIncludeMalhaAdjacent &&
                currentPlayer.score === 0 && currentPlayer.isAttacker) {
                settings = aGame.settings_near_malha(); // possible cells adjacent to Malha if first setting
            } else {
                let settingNearOpponent: string[] = aGame.settings_near_opponent();
                if (currentPlayer.isAttacker) {
                    // check if settings includes any of these and prefer to set on these
                    let settings2: string[] = aGame.settings_near_malha();
                    for (let si: number = 0; si < settings2.length; si++) {
                        if (settingNearOpponent.indexOf(settings2[si]) > 0) {
                            settings.push(settings2[si]);
                        }
                    }
                }
                if (settings.length === 0) { // if none are left check prefer these next ones
                    let settings3: string[] = ["d1", "e1", "c1", "a5", "a4", "a3", "c7", "d7",
                            "e7", "g5", "g4", "g3", "b5", "c6", "b3", "c2", "e2", "f3", "e6", "f5"];
                    // check if settings includes any of these and prefer to set on these
                    for (let si3:number = 0; si3 < settings3.length; si3++) {
                        if (settingNearOpponent.indexOf(settings3[si3]) > 0) {
                            settings.push(settings3[si3]);
                        }
                    }
                    if (settings.length === 0) {
                        settings = settingNearOpponent ;
                    }
                }
            }
            if (settings.length === 0) { // whatever is left
                settings = aGame.settings();
            }
            // no setting case
            if (settings== null || settings.length <= 0) {
                ret.error= "Unable to find any more settings";
                ret.possible = 0;
                return ret;
            }
            ret.from = "spare";

            if (playOptions.randomSetting) {
                var settingId:number = this.getRandom(0, settings.length - 1);
                ret.to = settings[settingId];
            } else {
                ret.to  = settings[0];
            }
            ret.possible = settings.length;
            ret.possibleSettings = settings;
            ret.ok = true;
            return ret;
        }

        public generateMove(aGame: Game, playOptions: IGamePlayOptions): AnalysedGameMove {
            if (aGame == null) {
                return new AnalysedGameMove("","",false,"Invalid Game");
            }
            if (aGame.is_in_setting_state()) {
                return this.generateSetting(aGame,playOptions);
            }
            if (aGame.is_in_moving_state() === false) {
                return new AnalysedGameMove("","",false,"Game is not in a valid state: " + aGame.state);
            }
            var ret: AnalysedGameMove = new AnalysedGameMove("","",true,"");
            let moves: GameMove[] = null;

            if (playOptions.searchMovesThatCaptureOpponent) {
                moves = aGame.moves_that_capture(aGame.moveSourceRequired);
            }
            if (playOptions.searchMovesThatSaveSelf) {
                let movesThatSave: GameMove[] = aGame.moves_that_save(aGame.moveSourceRequired);

                if (playOptions.preferMovesThatCaptureOverMovesThatSave === false && movesThatSave.length > 0) {
                    moves = movesThatSave;
                }
            }

            if (moves == null || moves.length === 0) {  // no capture able and no savable
                moves = aGame.moves_unreachables(aGame.moveSourceRequired);

                if (moves != null && moves.length > 0) {
                    ret.exchangeRequest = true;
                }
            }

            if (moves == null || moves.length === 0) { // no moves found following the above checks
                moves = aGame.moves(aGame.moveSourceRequired); // returns all possible moves
                ret.possible = moves.length;
            }
            if (moves == null || moves.length <= 0) {
                // if computer can not play -- resign or pass
                ret.ok = false;
                ret.error = "no moves found";
                ret.possible = 0;
                return ret;
            }

            var moveId:number = 0;
            if (aGame.moveSourceRequired!= null && aGame.moveSourceRequired.length >0) {
                for(var item:number = 0; item< moves.length; item++ ) {
                    if (moves[item].from === aGame.moveSourceRequired) {
                        moveId = item;
                        break;
                    }
                }
            } else {
                if (playOptions.randomMove) {
                    moveId = this.getRandom(0, moves.length - 1);
                }
            }

            // todo -- add check for game to rank the moves by score and play the one with the highest score
            var move: GameMove = moves[moveId];
            ret.from = move.from;
            ret.to = move.to;
            ret.ok = true;
            ret.possible = moves.length;
            ret.possibleMoves = moves;
          //  logMessage("Game Move generated: ");
          //  logObject(gameMove);
          //   displayComputerMessage("Generated computer move: " + gameMove.from + "-" + gameMove.to);
        }

        /**
         * @summary returns a random number from the given range
         * @param {any} lower - range start
         * @param {any} upper - range to
         */
        private getRandom(lower: number, upper: number): number {
            // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
            var percent:number = (Math.random() * 100);
            // this will return number between 0-99 because Math.random returns decimal number from 0-0.9929292 something like that
            // now you have a percentage, use it find out the number between your INTERVAL :upper-lower
            var num:number = ((percent * (upper - lower) / 100));
            // num will now have a number that falls in your INTERVAL simple maths
            num += lower;
            // add lower to make it fall in your INTERVAL
            // but num is still in decimal
            // use Math.floor>downward to its nearest integer you won't get upper value ever
            // use Math.ceil>upward to its nearest integer upper value is possible
            // math.round>to its nearest integer 2.4>2 2.5>3   both lower and upper value possible
            // console.log("upper: %s,lower: %s, num: %s, floor num: %s, ceil num: %s,
            // round num: %s", lower, upper, num, Math.floor(num), Math.ceil(num), Math.round(num));
            return Math.floor(num);
        }
    }
}