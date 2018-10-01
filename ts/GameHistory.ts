namespace Kharbga {
    /**
     * @summary Responsible for storing the game move history
     */
    export class GameHistory {
        settings: string[];
        moves: string[];
        constructor() {
            this.settings = [];
            this.moves = [];
        }

        /**
         * @summary Adds the player setting to the game history
         * @param {Player} player the player
         * @param settingCellId
         */
        public addSetting(player: Player, settingCellId: string): void {
            let move: string = player.isAttacker() ? "A" : "D" + ":" + settingCellId;
            this.settings.push(move);

        }

        /**
         * @summary Adds the player move to the history
         * @param {Player} player: the player
         * @param {string} fromCellId: the from cell id
         * @param {string} toCellId: the to cell id
         */

        public addMove(player: Player, fromCellId: string, toCellId: string): void {
            let move: string = player.isAttacker() ? "A" : "D" + ":" + fromCellId + "-" + toCellId;
            this.moves.push(move);
        }
 
        /**
         * @summary resets the game history
         */
        public reset(): void {
            this.moves = [];
            this.settings = [];
        }

        /**
         * @summary formats the history as a JSON string
         * @returns the JSON string
         */
        public getAsJson(): string {
            var obj = {
                settings: this.settings,
                moves: this.moves
            };
            return JSON.stringify(obj);
        }
    }
}