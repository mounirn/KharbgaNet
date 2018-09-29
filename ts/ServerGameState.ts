namespace Kharbga{
    export class ServerGameState {
        public id: string;
        public createdBy: string;
        public createdOn: Date;
        public attackerName: string;
        public defenderName: string;
        public state: GameState;
        public status: GameStatus;
        public moves: Array<GameMove>;
        public players: Array<Player>;
        public attacker: Player;
        public defender: Player;

        constructor(id: string, createdBy: string, state: GameState, status: GameStatus, attacker: Player, defender: Player) {
            this.id = id;
            this.createdBy = createdBy;
            this.state = state;
            this.status = status;
            this.moves = [];
            this.players = [];

            this.attacker = attacker;
            this.defender = defender;
        }
    }
}