namespace Kharbga {
    export interface IGamePlayOptions {
        firstSettingMustIncludeMalhaAdjacent : boolean;
        randomSetting: boolean;
        searchMovesThatCaptureOpponent : boolean;
        searchMovesThatSaveSelf: boolean;
        preferMovesThatCaptureOverMovesThatSave: boolean;
        randomMove: boolean;
    }
}