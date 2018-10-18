namespace Kharbga {
    /**
     * @summary defines the possible states of a game
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
         *  attacker is unblocked and is able to play. But, they may choose to just request pay up. 
         * This is why this is an automatic loss for the attacker
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
}