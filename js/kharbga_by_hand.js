/**
 * Defines the player types. We could have games where:
 *  - a person plays against another person
 *  - a computer plays against another computer
 *  - a person plays against a computer
 */
var PLAYER_TYPE = {
    PERSON: { value: 1, name: "Person", code: "P" },
    COMPUTER: { value: 2, name: "Computer", code: "C" }
};

/**
 * A player could be either an attacker, a defender, or spectator. 
 * A spectator could make move suggestions to either players assuming they are given the OK.
 */
var PLAYER_ROLE = {
    ATTACKER: { value: 1, name: "Attacker", code: "A" },
    DEFENDER: { value: 2, name: "Defender", code: "D" },
    ATTACKER: { value: 3, name: "Spectator", code: "S" }
};

/**
 * Defines the possible states of a cell
}*/
var BOARD_CELL_STATE = {
    Empty: { value: 1, name: "Empty", code: "E"},
    OccupiedByAttacker: { value: 2, name: "Occupied By Attacker", code: "A"},
    OccupiedByDefender: { value: 3, name: "Occupied By Defender", code: "D"},
    OccupiedByDefenderRequestingTwo: { value: 4, name: "Occupied By Defender - Unreachable ", code: "D2"},
};


function BoardCell() {

    const _RightLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
    const _LeftLabels = ["A", "B", "C", "D", "E", "F", "G"];

    var row = 0;
    var col = 1;

    var id = "";
    var state = BOARD_CELL_STATE.Empty;



};