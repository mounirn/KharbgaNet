namespace Kharbga {
     /**
      * @summary Defines various parameters related to the current player move
      */
    export class GameMoveFlags {
        public resigned: boolean;
        public exchangeRequest: boolean;
        public exchangeRequestDefenderPiece: string;
        public exchangeRequestAccepted: boolean;
        public exchangeRequestAttackerPiece1: string;
        public exchangeRequestAttackerPiece2: string;

        constructor() {
            this.resigned = false;
            this.exchangeRequest = false;
            this.exchangeRequestAccepted = false;
            this.exchangeRequestDefenderPiece = "";
            this.exchangeRequestAttackerPiece1 = "";
            this.exchangeRequestAttackerPiece2 = "";
        }

        public reset(): void {
            this.resigned = false;
            this.exchangeRequest = false;
            this.exchangeRequestAccepted = false;
            this.exchangeRequestDefenderPiece = "";
            this.exchangeRequestAttackerPiece1 = "";
            this.exchangeRequestAttackerPiece2 = "";
        }
    }
}