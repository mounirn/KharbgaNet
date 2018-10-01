namespace Kharbga {
    /**
     * @summary Represents a game player. The game is played by two players, an attacker and a defender.
     * Players use 24 game pieces to set the board.
     * The players take turns in setting the board two pieces each turn.
     * After the board is set, players take turns to make game moves capturing each others pieces or demanding exchanges.
     *  the Attacker has the
     * advantages of setting his two pieces first.   The Defender follows a setting strategy so their pieces
     *  do not get captured by the Attacker.
     */
    export class Player {
        occupiedCells = new Array(24);
        public readonly isAttacker : boolean;
        public readonly isSystem : boolean;
        public isSpectator: boolean;
        totalTimeThinkingSinceStartOfGame: number = 0;
        constructor(isComputer: boolean, isAttacker: boolean) {
            this.isAttacker = isAttacker;
            this.isSystem = isComputer;
        }

        /// the player selects a color to use for their pieces and profile
        public color: string;

        /// the player selects an image to use for their pieces and profile
        public imageUrl: string;

        /// the name of the player
        public name: string;

        // this is the user's account id
        public emailAddress: string;

        reset(): void {
            this.totalTimeThinkingSinceStartOfGame = 0;
        }
    }

    /**
     * @summary The attacker is the first one who starts the setting and the one that makes the first move
     *
     */
    export class Attacker extends Player {
        constructor() {
            super(false,true);

        }
    }

    /**
     * @summary The Defender follows the attacker setting and moves. Demands exchanges.
     */
    export class Defender extends Player {
        constructor() {
            super(false,false);

        }
    }
}