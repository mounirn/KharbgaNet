namespace Kharbga {
    /**
     * @summary Defines various move error cases
     */
    export enum BoardMoveType {
        SettingOnValidCell,
        SettingOnOccupiedCell,
        SettingOnMiddleCell,
        SelectedCellThatIsSurroundedForMoving,
        SelectedEmptyOrOpponentPieceForMoving,
        MovingToAnOccupiedCell,
        MovingToNotAdjacentCell,
        MovedToAValidCell,
        OpponentPieceCaptured,
        InvalidCellId,
        DefenderPieceExchanged,
        AttackerPieceExchanged
    }

}