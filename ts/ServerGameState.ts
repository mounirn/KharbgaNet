namespace Kharbga{
    export class ServerGameState {
        public ID: string;
        public CreatedBy: string;
        public CreatedOn: Date;
        public AttackerName: string;
        public DefenderName: string;
        public State: GameState;
        public Status: GameStatus;
        public Moves: Array<GameMove>;
        public Players: Array<Player>;
        public Attacker: Player;
        public Defender: Player;

        constructor(id: string, createdBy: string, state: GameState, status: GameStatus, attacker: Player, defender: Player) {
            this.ID = id;
            this.CreatedBy = createdBy;
            this.State = state;
            this.Status = status;
            this.Moves = [];
            this.Players = [];

            this.Attacker = attacker;
            this.Defender = defender;
        }
    }
}