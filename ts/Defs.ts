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
     * @summary Defines the possible states of a game
     */
    export enum GameState {
        NotStarted,     // the game at creation time
        Started,        // started by a player
        Pending,        // pending joining by another player (not spectator)
        /*
         * @summary - the game starts by the attacker setting his/her pieces on the board with the objective
         * of capturing the defender's pieces and limiting the defender from building up protected
         * areas where his pieces could freely move.
         * the defender's objective is to protect his pieces, capture the attacker's pieces (Agban), and
         * buildup protected areas where the attacker can not move into.
         * the defender's pieces that can freely move in these protected areas are called Untouchables (mhaffef)
         * The only way for the attacker to remove Untouchable pieces from the board is to pay the defender using
         * two of his/her own pieces. The three pieces involved in the exchange must be approved by the defender.
         * With these Untouchable pieces, the defender could win the game if the attacker can not make
         * exchanges.
         */
        Setting,

        /* @summary - This is an illegal condition at the beginning of a game.
         * After setting is completed, the attacker is required to move first.
         * After the attacker's first move is completed, the defender must be
         * able to play. If the defender is blocked after the first move, the attacker loses and
         * the defender is declared a winner. After the first move by the defender, the attacker can
         * block the defender from moving. In this case, the defender must pass their turn
         * and request the attacker to continue playing until one or more pieces of the
         * defender are unblocked. In most cases, this condition results in the defender losing
         * all their pieces.
         */
        DefenderCanNotMove,

        /* @summary - This state happens after the first move by the defender.
         * It is a legal state and the attacker loses the game
         * in most cases. In this legal case, the defender can freely move their pieces until the
         *  attacker is unblocked and is able to play.
         */
        AttackerCanNotMove,

        /* After completing setting, this game goes to this state for players to start the first moves
         */
        Moving,

        // in this state, the defender is able to freely move a piece in a protected area unreachable by
        // the attacker and is demanding exchanges (one piece of the defender for two pieces of the attacker). An  attacker's 
        // piece must be able to freely move in order to be able to participate in an exchange.
        DefenderMovingUntouchable,

        // the attacker abandons play and loses the game when they can not capture all of the defender's pieces. 
        // the defender's untouchable pieces are twice the value of the attacker's pieces.
        AttackerAbandoned,

        // the defender abandons play and loses the game when all their pieces are captured
        DefenderAbandoned,

        // defender lost all pieces.
        DefenderLostAllPieces,

        // attacker lost all pieces.
        AttackerLostAllPieces,

        WinnerDeclared,

        WinnerDeclaredDefenderIsBlocked


    }

    /**
     * @summary - Defines various game status as relating to the network/server
     */
    export enum GameStatus {
        // the game after just being created by one player
        Created,

        // after it gets joined by another player or system
        Joined,

        // active between two players after the first attacker's move
        Active,

        // cCompleted a winner was determined
        Completed,

        // aborted by a user
        Aborted,

        // one of the user disconnected
        Disconnected
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