namespace Kharbga {
    export class BoardEventData {
        from: BoardCell;
        to: BoardCell;
        targetCellId: string;
        type: BoardMoveType;
        errorCode: string;
        public constructor(from: BoardCell, to: BoardCell, targetCellId: string = "", type: BoardMoveType) {
            this.from = from;
            this.to = to;
            this.targetCellId = targetCellId;
            this.type = type;
        }
    }

    export interface IBoardEvents {
        invalidMoveEvent(eventData: BoardEventData): void;
        validMoveEvent(eventData: BoardEventData): void;
        capturedPieceEvent(eventData: BoardEventData): void;
        exchangedPieceEvent(eventData: BoardEventData): void;
    }
}