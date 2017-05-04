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

        constructor(id: string, createdBy: string, state: GameState, status: GameStatus) {
            this.ID = id;
            this.CreatedBy = createdBy;
            this.State = state;
            this.Status = status;
            this.Moves = [];
            this.Players = [];
        }
    }
}