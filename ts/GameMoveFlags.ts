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

        public copy(f: GameMoveFlags): void {
            if (f === null) { // throw
                return;
            }
            this.resigned = f.resigned;
            this.exchangeRequest = f.exchangeRequest;
            this.exchangeRequestAccepted = f.exchangeRequestAccepted;
            this.exchangeRequestDefenderPiece = f.exchangeRequestDefenderPiece ;
            this.exchangeRequestAttackerPiece1 = f.exchangeRequestAttackerPiece1;
            this.exchangeRequestAttackerPiece2 = f.exchangeRequestAttackerPiece2;
        }
    }
}