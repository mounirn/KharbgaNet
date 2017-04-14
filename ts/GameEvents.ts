namespace Kharbga{
    export class GameEventData {
        source: Game;
        player: Player;
        from: BoardCell;
        to: BoardCell;
        targetCellId: string;
        move_status: PlayerMoveStatus;
        public constructor(game: Game, currentPlayer: Player) {
            this.source = game;
            this.player = currentPlayer;
            this.from = null;
            this.to = null;
            this.targetCellId = "";
            this.move_status = PlayerMoveStatus.OK;
        }
    }
	export interface IGameEvents{
        newGameStartedEvent(eventData: GameEventData) : void;
        newPlayerTurnEvent(eventData: GameEventData) : void;
        newSettingCompletedEvent(eventData: GameEventData): void;
        settingsCompletedEvent(eventData: GameEventData): void;
        newMoveStartedEvent(eventData: GameEventData): void;
        newMoveCompletedEvent(eventData: GameEventData): void;
        newMoveCompletedContinueSamePlayerEvent(eventData: GameEventData): void;
        newMoveCanceledEvent(eventData: GameEventData): void;
        winnerDeclaredEvent(eventData: GameEventData): void;
        untouchableSelectedEvent(eventData: GameEventData): void;
        untouchableExchangeCanceledEvent(eventData: GameEventData): void;
        invalidSettingMalhaEvent(eventData: GameEventData): void;
        invalidSettingOccupiedEvent(eventData: GameEventData): void;

        invalidMoveEvent(eventData: GameEventData): void;
	}
}