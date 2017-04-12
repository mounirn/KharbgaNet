namespace Kharbga {
    /**
     * Defines the player types. We could have games where:
     * - a person plays against another person
     * - a computer plays against another computer
     * - a person plays against a computer
     */
    export enum PlayerType {
        Person,
        Computer
    }


    /**
     * A player could be either an attacker, a defender, or spectator. 
     * A spectator could make move suggestions to either players assuming they are given 
     * the OK.
     */
    export enum PlayerRole {
        Attacker,
        Defender,
        Spectator
    }

    export enum PlayerSettingStatus {
        OK,
        ERR_INVALID_CELL,
        ERR_MALHA,
        ERR_OCCUPIED
    }

    export enum PlayerMoveStatus {
        OK,
        ERR_FROM_IS_SURROUNDED,
        ERR_TO_IS_OCCUPIED,
        ERR_TO_IS_IS_NOT_AN_ADJACENT_CELL
    }

    /**
     * Defines the possible states of a cell
     */
    export enum BoardCellState {
        Empty,
        OccupiedByAttacker,
        OccupiedByDefender,
        OccupiedByDefenderRequestingTwo
    }

    /// <summary>
    /// Defines various move error cases
    /// </summary>
    export enum BoardMoveType {
        SettingOnValidCell,
        SettingOnOccupiedCell,
        SettingOnMiddleCell,
        SelectedCellThatIsSourroundedForMoving,
        SelectedEmptyOrOpponentPieceForMoving,
        MovingToAnOccupiedCell,
        MovingToNotAjacentcell,
        MovedToAValidCell,
        OpponentPieceCaptured
    };

    /**
     * Players 
     */
    export enum PieceState {
        IsNotSetYet,  // Waiting to be set
        IsOnBoard,    // Is already set
        IsOnBoardUntouchable,    // useful for defender only (able to move and is unreachable)
        IsCapturedOnBoard,
        IsCapturedOffBoard,
        IsExchanged
    }
    /**
     * Defines the possible states of a game
     */
    export enum GameState {
        // The game at startup. 
        NotStarted,


        /// The game starts by the attacker setting his/her pieces on the board with the objective
        /// of caputuring the defender's pieces and limiting the defender from building up protected 
        /// areas where his pieces could freely move.
        /// 
        /// The defender's objective is to protect his pieces, capture the attacker's pieces (Agban), and 
        /// buildup protected areas where the attacker can not move into.
        /// The defender's pieces that can freely move in these protected areas are called Untouchables (mhaffef). 
        /// 
        /// The only way for the attacker to remove Untouchable pieces from the board is to pay the defender using
        /// two of his/her own pieces. The three pieces involved in the exchange must be approved by the defender. 
        /// 
        /// With these Untouchable pieces, the defender could win the game if the attacker can not make
        /// exchanges.  
        Setting,

        /// This is an illegal condition at the begining of a game. 
        /// After setting is completed, the attacker is required to move first. 
        /// After the attacker's first move is completed, the defender must be 
        /// able to play. If the defender is blocked after the first move, the attacker loses and 
        /// the defender is declated a winner. After the first move by the defender, the attacker can 
        /// block the defender from moving. In this case, the defender must pass thier turn 
        /// and request the attacker to continue playing until one or more pieces of the 
        /// defender are unblocked. In most cases, this condition results in the defender losing 
        /// all their pieces. 
        DefenderCanNotMove,

        ///  This state happens after the first move by the defender. It is legal state and attacker loses the game
        ///  in most cases. In this legal case, the defender can freely move their pieces until the attacker is unblocked and is able to play. 
        AttackerCanNotMove,

        /// After completing s
        Moving,

        /// In this state, the defender is able to freely move a piece in an protected area unreachable by 
        /// the attacker and is demanding exchanges (one piece of the defender for two pieces of the attacker). The attacker's 
        /// pieces must be able to freely move. 
        DefenderMovingUntouchable,

        /// The attacker abondons play and loses the game when they can not capture all of the defender's pieces. 
        /// The defender's untouchable pieces are twice the value of the attacker's pieces. 
        AttackerAbondoned,

        /// The defender abondons play and loses the game when all their pieces are captured 
        DefenderAbondoned,

        /// Defender lost all pieces.
        DefenderLostAllPieces,

        WinnerDeclared
    }

    export enum GameActionType {
        Setting,
        Move,
        MoveCapture,
        DefenderRequestTwo,
        DefenderRequestTwoAccepptedByAttacker
    }

    /**
     * Represents a game player. The game is played by two players, an attacker and a defender. Players use 24 game pieces to set the board. 
     * The players take turns in setting the board two pieces each turn.
     * After the board is set, players take turns to make game mvoes capturing each other pices or demanding exchanges. the Attacker has the
     * advantages of setting his two pieces first.   The Defender follows a setting strategy so their pieces do not get captured by the Attacker.
     */
    export class Player {
        occupiedCells = new Array(24);
        type: PlayerType;
        role: PlayerRole;
        toalTimeThinkingSinceStartOfGame: 0;
        constructor(role: PlayerRole) {
            this.type = PlayerType.Person;
            this.role = role;
        }

        /// The player selects a color to use for their pieces and profile
        public Color: string

        /// The player selects an image to use for their pieces and profile
        public Image: string

        /// The name of the player
        public Name: string

        // This is the user's account id
        public EmailAddress: string

        /// A player could be either an attacker or a defender
        IsAttacker(): boolean { return this.role == PlayerRole.Attacker; }
        IsDefender(): boolean { return this.role == PlayerRole.Defender; }



        Type(): PlayerType { return this.type; }
        Role(): PlayerRole { return this.role; }


        Reset(): void {
            this.toalTimeThinkingSinceStartOfGame = 0;
        }
    }

    /**
     * The attacker is the first one who starts the setting and the one that makes the first move
     * 
     */
    export class Attacker extends Player {
        constructor() {
            super(PlayerRole.Attacker);

        }
    }

    /**
     * Defender follows the attacker setting
     */
    export class Defender extends Player {
        constructor() {
            super(PlayerRole.Defender);

        }
    }

    /// <summary>
    /// Reprsents the piece that players use to make their moves on the board
    /// </summary>
    export class Piece {
        state: PieceState;

        constructor() {
            this.state = PieceState.IsNotSetYet;
        }
        State(): PieceState {
            return this.state;
        }


        Value(): number {
            if (this.State() == PieceState.IsOnBoard)
                return 1;
            else if (this.State() == PieceState.IsOnBoardUntouchable)
                return 100;
            else
                return 0;
        }
    }

    export class GameMove {
        constructor(from: string, to: string, p: Player) {
            this.From = from;
            this.To = to;
            this.Player = p;
        }
        public From: string;
        public To: string;
        public Player: Player;
    }

  
}