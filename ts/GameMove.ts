namespace Kharbga {
    /**
     * @summary: Defines a game move
     */
    export class GameMove {
        constructor(from: string, to: string, p: Player) {
            this.from = from;
            this.to = to;
            this.player = p;
            this.isSetting = false;
            this.exchangeRequest = false;
        }
        public from: string;
        public to: string;
        public resigned: boolean;
        public exchangeRequest: boolean;

        public player: Player;
        public isSetting: boolean;

        public number: number;
        public gameName: string;
        public playerName: string;

        public moveTime: Date;
        public beforeFen: string;
        public afterFen: string;
        public message: string;
        public clientId: string;
    }
}