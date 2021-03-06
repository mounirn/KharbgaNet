namespace Kharbga {
    export class GameInfo {
        public id: string;
        public isNetworkGame: boolean;
        public createdBy: string;
        public createdOn: Date;
        public state: GameState;
        public status: GameStatus;
        public moves: GameMove[];
        public players: Player[];
        public attacker: Player;
        public defender: Player;
        private nextMoveNumber: number;

        constructor() {
            this.reset();
        }
        public setup(id: string, createdBy: string, state: GameState, status: GameStatus,
                 attacker: Player, defender: Player): void {
            this.id = id;
            this.createdBy = createdBy;
            this.state = state;
            this.status = status;
            this.moves = new Array<GameMove>();
            this.players = [];

            this.attacker = attacker;
            this.defender = defender;
            this.players = [this.attacker,this.defender];
        }

        public reset(): void {
            this.id = "";
            this.nextMoveNumber = 0;
            this.moves= [];
            this.status = GameStatus.Created;
            this.state = GameState.NotStarted;
            this.defender = new Defender();
            this.attacker= new Attacker();
            this.players = [this.attacker,this.defender];
            this.isNetworkGame = false;

        }
        public update(gameInfo: GameInfo): void {
            if (gameInfo == null || gameInfo === this) {
                return;
            }
            this.id = gameInfo.id;
            this.moves=  [];
            for (let move of gameInfo.moves) {
                this.moves.push(move);
            }
            this.status = gameInfo.status;
            this.state = gameInfo.state;
            this.attacker = gameInfo.attacker;
            this.defender = gameInfo.defender;
            this.players = [this.attacker,this.defender];
            this.nextMoveNumber = gameInfo.nextMoveNumber;

            this.isNetworkGame =  (gameInfo.isNetworkGame === true) ;

        }
        public getComputerPlayer(): Player {
            if (this.attacker !== null && this.attacker.isSystem === true) {
                return this.attacker;
            }
            if (this.defender !== null && this.defender.isSystem === true) {
                return this.defender;
            }
            return null;
        }

        public newMove(player: Player): GameMove {
            var ret: GameMove = new GameMove("","",null);
            ret.number = this.nextMoveNumber++;
            ret.player = player;
            if (player!== null) {
                ret.playerName = player.name;
            }

            return ret;
        }
        public getNextMoveNumber(): number {
             this.nextMoveNumber++;
             return this.nextMoveNumber;
        }
    }
}