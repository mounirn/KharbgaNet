 namespace Kharbga {
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

        // completed and a winner was determined
        Completed,

        // one of the user disconnected
        Disconnected
    }
 }
