namespace Kharbga {
    export class GameInfo {
        public id: string;
        public createdBy: string;
        public createdOn: Date;
        public attackerName: string;
        public defenderName: string;
        public attackerScore: number;
        public defenderScore: number;
        public state: GameState;
        public status: GameStatus;
        public moves: GameMove[];
        public players: Player[];
        public attacker: Player;
        public defender: Player;
        private nextMoveNumber: number;

        constructor() {
            this.id = "";
            this.state = 0;
            this.status = 0;
            this.moves = new Array<GameMove>();
            this.defender = new Defender();
            this.attacker= new Attacker();
            this.attackerName = "Attacker";
            this.defenderName = "Defender";
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.players = [this.attacker,this.defender];
            this.nextMoveNumber = 1;
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
            this.nextMoveNumber = 1;
            this.attackerName = "";
            this.defenderName = "";
            this.attackerScore = 0;
            this.defenderScore = 0;
            this.moves= new Array<GameMove>();
            this.status = GameStatus.Created;
            this.state = GameState.NotStarted;
            this.attacker = null;
            this.defender = null;
            this.players = [];

        }
        public update(gameInfo: GameInfo): void {
            if (gameInfo == null) {
                return;
            }
            this.id = gameInfo.id;
            this.attackerName = gameInfo.attackerName;
            this.defenderName = gameInfo.defenderName;
            this.attackerScore = gameInfo.attackerScore;
            this.defenderScore = gameInfo.defenderScore;
            this.moves=  new Array<GameMove>();
            for (let move of gameInfo.moves) {
                this.moves.push(move);
            }
            this.status = gameInfo.status;
            this.state = gameInfo.state;
            this.attacker = gameInfo.attacker;
            this.defender = gameInfo.defender;
            this.players = [this.attacker,this.defender];
            this.nextMoveNumber = gameInfo.nextMoveNumber;
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
            return this.nextMoveNumber++;
        }
    }
}