// https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines
namespace Kharbga {
    /**
     * @summary Defines the player types. We could have games where:
     * - a person plays against another person on the same computer
     * - a person plays the computer on the same computer
     * - a person plays against another person on another computer
     */
    export enum PlayerType {
        Person,
        Computer
    }

    /**
     * @summary A player could be either an attacker, a defender, or spectator. 
     * A spectator could make move suggestions to either players assuming they are given 
     * the OK.
     */
    export enum PlayerRole {
        Attacker,
        Defender,
        Spectator
    }

    /**
     * @summary defines possible returns status when setting a player pieces on the board
     */
    export enum PlayerSettingStatus {
        OK,
        ERR_INVALID_CELL,
        ERR_MALHA,
        ERR_OCCUPIED
    }
    /**
     * @summary defines the the possible returns status when player makes a move
     */
    export enum PlayerMoveStatus {
        OK,
        ERR_FROM_IS_SURROUNDED,
        ERR_TO_IS_OCCUPIED,
        ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL,
        ERR_INVALID
    }

    /**
     * @summary Defines the possible states of a board cell
     */
    export enum BoardCellState {
        Empty,
        OccupiedByAttacker,
        OccupiedByDefender,
        OccupiedByDefenderRequestingTwo
    }

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

    /**
     * @summary Defines piece states   -- this is now obsolete
     */
    export enum PieceState {
        IsNotSetYet,  // waiting to be set
        IsOnBoard,    // is already set
        IsOnBoardUntouchable,    // useful for defender only (able to move and is unreachable)
        IsCapturedOnBoard,
        IsCapturedOffBoard,
        IsExchanged
    }

    /**
     * @summary define a game action type  -- used for logging mainly
     */
    export enum GameActionType {
        Setting,
        Move,
        MoveCapture,
        DefenderRequestTwo,
        DefenderRequestTwoAcceptedByAttacker
    }


    /**
     *  @summary Represents the piece that players use to make their moves on the board
     */
    export class Piece {
        state: PieceState;

        constructor() {
            this.state = PieceState.IsNotSetYet;
        }
        value(): number {
            if (this.state === PieceState.IsOnBoard) {
                return 1;
            } else if (this.state === PieceState.IsOnBoardUntouchable) {
                return 100;
            } else {
                return 0;
            }
        }
    }
}