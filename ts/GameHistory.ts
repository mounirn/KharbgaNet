namespace Kharbga {
    /**
     * Responsible for storing the game move history
     */
    export class GameHistory {
        settings: string[];
        moves: string[];
        /// <summary>
        /// Creates the move history
        /// </summary>
        constructor() {
            this.settings = [];
            this.moves = [];
        }

        //  public delegate void GameHistoryEventHandler(object sender, GameHistoryEventArgs e);
        //  public event GameHistoryEventHandler AddedMovetoGameHistoryEvent;


        /**
         *  Adds the player setting to the game history
         * @param player
         * @param settingCellId
         */
        AddSetting(player: Player, settingCellId: string): void {
            let move = player.isAttacker() ? 'A' : 'D' + ":" + settingCellId;
            this.settings.push(move);

            //AddedMovetoGameHistoryEvent(this, new GameHistoryEventArgs(player, settingCellId, string.Empty));

        }

        /// <summary>
        /// Adds the player move to the history
        /// </summary>
        /// <param name="player"></param>
        /// <param name="fromCellId"></param>
        /// <param name="toCellId"></param>
        AddMove(player: Player, fromCellId: string, toCellId: string) {
            let move = player.isAttacker() ? 'A' : 'D' + ":" + fromCellId + "-" + toCellId;

            this.moves.push(move);

            //AddedMovetoGameHistoryEvent(this, new GameHistoryEventArgs(player, fromCellId, toCellId));

        }

        /*    GetAsJson() : JSON {
                XElement game = new XElement("kharbga");
                XElement settings = new XElement("settings");
                foreach(string setting in _settings)
                {
                    settings.Add(new XElement("setting", setting));
                }
                game.Add(settings);
                XElement moves = new XElement("moves");
                foreach(string move in _moves)
                {
                    moves.Add(new XElement("move", move));
                }
                game.Add(moves);
                return game;
            }
            */
    }
}