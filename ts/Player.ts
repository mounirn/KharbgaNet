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
     //   occupiedCells = new Array(24); -- not used
        public readonly isAttacker : boolean;
        public readonly isSystem : boolean;
        public readonly isSpectator: boolean;
        public totalTimeThinkingSinceStartOfGame: number = 0;
        constructor(isComputer: boolean = false, isAttacker: boolean = true, isSpectator: boolean = false) {
            this.isAttacker = isAttacker;
            this.isSystem = isComputer;
            this.isSpectator = isSpectator;
            this.score = 0;
            this.totalTimeThinkingSinceStartOfGame = 0;
            this.color= "";
            this.emailAddress= "";
            this.imageUrl = "";
        }

        /// the player selects a color to use for their pieces and profile
        public color: string;

        /// the player selects an image to use for their pieces and profile
        public imageUrl: string;

        /// the name of the player
        public name: string;

        // this is the user's account id
        public emailAddress: string;

        public score: number;

        reset(): void {
            this.totalTimeThinkingSinceStartOfGame = 0;
            this.score = 0;
        }
    }

    /**
     * @summary The attacker is the first one who starts the setting and the one that makes the first move
     *
     */
    export class Attacker extends Player {
        constructor() {
            super(false,true,false);
            this.name = "Attacker";
        }
    }

    /**
     * @summary The Defender follows the attacker setting and moves. Demands exchanges.
     */
    export class Defender extends Player {
        constructor() {
            super(false,false,false);
            this.name = "Defender";
        }
    }

    /**
     * @summary Represents a player in the system that automatically generates a possible move
     *    given an existing game state
     */
    export class SystemPlayer extends Player {
        constructor (asAttacker: boolean) {
            super(true,asAttacker,false);
            this.name = "System";
        }
    }
    /**
     * @summary Represents a spectator watching the game
     *    given an existing game state
     */
    export class Spectator extends Player {
        constructor () {
            super(false,false,true);
            this.name = "Spectator";
        }
    }
}