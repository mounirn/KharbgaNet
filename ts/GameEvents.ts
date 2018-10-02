namespace Kharbga{
    export class GameEventData {
        source: Game;
        player: Player;
        from: BoardCell;
        to: BoardCell;
        targetCellId: string;
        move_status: PlayerMoveStatus;
        move_flags: GameMoveFlags;

        public constructor(game: Game, currentPlayer: Player) {
            this.source = game;
            this.player = currentPlayer;
            this.from = null;
            this.to = null;
            this.targetCellId = "";
            this.move_status = PlayerMoveStatus.OK;
        }
    }
	export interface IGameEvents {
        newGameStartedEvent(eventData: GameEventData): void;
        newPlayerTurnEvent(eventData: GameEventData): void;

        // player passed since they do not have a valid move (if they are blocked) not after the first move
        playerPassedEvent(eventData: GameEventData): void;

        newSettingCompletedEvent(eventData: GameEventData): void;
        settingsCompletedEvent(eventData: GameEventData): void;
        newMoveStartedEvent(eventData: GameEventData): void;
        newMoveCompletedEvent(eventData: GameEventData): void;
        newMoveCompletedContinueSamePlayerEvent(eventData: GameEventData): void;
        newMoveCanceledEvent(eventData: GameEventData): void;
        winnerDeclaredEvent(eventData: GameEventData): void;

        untouchableSelectedEvent(eventData: GameEventData): void;
        untouchableExchangeCanceledEvent(eventData: GameEventData): void;
        untouchableExchangeCompletedEvent(eventData: GameEventData): void;


        invalidSettingMalhaEvent(eventData: GameEventData): void;
        invalidSettingOccupiedEvent(eventData: GameEventData): void;

        invalidMoveEvent(eventData: GameEventData): void;

        moveProcessed(status: boolean, eventData: GameMove): void;
	}
}