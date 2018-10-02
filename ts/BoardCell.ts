namespace Kharbga{
	/**
	 * @summary Represents a Kharbga Board cell.
	 */
    export class BoardCell {
        /* Display Labels */
        static TopLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
        static BottomLabels = ["A", "B", "C", "D", "E", "F", "G"];
        private board: Board;

        public static COLUMNS = "abcdefg".split("");
        public static ROWS = "1234567".split("");

        private row: number;   // 0 to 6
        private col: number;   // 0 to 6
        public readonly id: string;    // this is the location following the notation column label followed by row label
        // examples: a1, b2, d3, etc.

        private state: BoardCellState = BoardCellState.Empty;

        private  left: BoardCell = null;
        private  right: BoardCell = null;
        private  up: BoardCell = null;
        private  down: BoardCell = null;

        private listAdjacentCells: BoardCell[];

        /**
         * @summary Board cells are created on a board of size 7 x 7
         * @param b the board
         * @param row: 0-6
         * @param col: 0-6
         */
        public constructor(b: Board, row: number, col: number) {
            if (row < 0 || row > 6) {
                alert("invalid board row: " + row);
            }
            if (col < 0 || col > 6) {
                alert("invalid board col: " + col);
            }

            this.board = b;
            this.row = row;
            this.col = col;
            this.id = BoardCell.COLUMNS[col] + BoardCell.ROWS[row];
            this.listAdjacentCells = [];
        }

        /**
         * Returns the cell above or null if on the top edge
         */
        public Above(): BoardCell {
            return this.up;
        }

        /**
         * Returns the cell below or null if on the bottom edge
         */
        public Below(): BoardCell {
            return this.down;
        }

        /**
         * Returns the cell to the right or null if on the right edge
         */
        public Right(): BoardCell {
            return this.right;
        }

        /**
         * Returns cell to the left or null if on the left edge
         */
        public Left(): BoardCell {
            return this.left;
        }

        /**
         * Returns the current cell state
         */
        public State(): BoardCellState {
            return this.state;
        }

        /**
         * Checks if the current cell is occupied or not
         */
        public isOccupied(): boolean {
            return this.state !== BoardCellState.Empty;
        }

        /**
         * Checks if the current cell is occupied by an attacker piece or not
         */
        public isOccupiedByAttacker(): boolean {
            return this.state === BoardCellState.OccupiedByAttacker;
        }


        /**
         * Checks if the current cell is occupied by a defender piece or not
         */
        public isOccupiedByDefender(): boolean {
            return this.state === BoardCellState.OccupiedByDefender;
        }

        /**
         * Check id the current cell is the middle cell which is left empty after each player sets their peices on the board
         * Malha means salty in Arabic.  Players are not allowed to set (seed) their piece on the salty land.
         */
        public isMalha(): boolean {
            if (this.row === 3 && this.col === 3) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @summary Sets a piece on the board with either an attacker or a defender piece
         * @param playerIsAttacker indicates whether an attacker or a defender setting
         */
        public setPiece(playerIsAttacker: boolean): void {
            if (playerIsAttacker) {
                this.state = BoardCellState.OccupiedByAttacker;
            } else {
                this.state = BoardCellState.OccupiedByDefender;
            }
        }

        /**
         * @summary Sets a piece with the same state as the give cell
         * @param cell - the cell to copy state from
         */
        public setSameAs(cell: BoardCell): void {
            this.state = cell.state;
        }

        /**
         * @summary Determines the adjacent cells and sets them for easy access from each cell
         * Called by the table ctor
         */
        public setAdjacentCells(board: Board): void {
            // add check if board is null

            if (board == null) {
                alert("board is null");
                // todo: add debugging logic here
                return;
            }
            this.board = board;

            // on the same row back;
            if (this.col - 1 >= 0) {
                this.left = board.getCell(this.row, this.col - 1);
                if (this.left != null) {
                    this.listAdjacentCells.push(this.left);
                }
            }

            // on the same row forward
            if (this.col + 1 <= 6) {
                this.right = board.getCell(this.row, this.col + 1);
                if (this.right != null) {
                    this.listAdjacentCells.push(this.right);
                }
            }

            // on the same col up;
            if (this.row - 1 >= 0) {
                this.up = board.getCell(this.row - 1, this.col);
                if (this.up != null) {
                    this.listAdjacentCells.push(this.up);
                }
            }

            // on the same col down;
            if (this.row + 1 <= 6) {
                this.down = board.getCell(this.row + 1, this.col);
                if (this.down != null) {
                    this.listAdjacentCells.push(this.down);
                }
            }
        }

        /**
         * Returns the adjacent cells
         */
        public getAdjacentCells(): BoardCell[] {
            return this.listAdjacentCells;
        }

        /**
         * Checks if the give cell is adjacent to this one
         * @param cell
         */
        public isAdjacentTo(cell: BoardCell): boolean {
            let ret: boolean = false;
            for (var i: number = 0; i < this.listAdjacentCells.length; i++) {
                let adjCell: BoardCell = this.listAdjacentCells[i];
                if (adjCell === cell) {
                    ret = true;
                    break;
                }
            }
            return ret;
        }

        /**
         * @summary Sets the cell state to empty
         */
        public clear(): void {
            this.state = BoardCellState.Empty;
        }

        /**
         * @summary Checks if the cell is occupied by the given player
         * @param {Player} player - the player to check
         * @returns {boolean} true if the player is occupying the cell, false otherwise
         */
        public isOccupiedBy(player: Player): boolean {
            switch (this.state) {
                case BoardCellState.Empty:
                    return false;
                case BoardCellState.OccupiedByAttacker:
                    return player.isAttacker;
                case BoardCellState.OccupiedByDefender:
                    return !player.isAttacker;
                default:
                    return false;
            }
        }

        /**
         * @summary Checks if the cell is occupied by the opponent of the given player
         * @param {Player} player - the player to check
         * @returns {boolean} true if the opponent player is occupying the cell, false otherwise
         */
        public isOccupiedByOpponent(player: Player): boolean {
            switch (this.state) {
                case BoardCellState.Empty:
                    return false;
                case BoardCellState.OccupiedByAttacker:
                    return !player.isAttacker;
                case BoardCellState.OccupiedByDefender:
                    return player.isAttacker;
                default:
                    return false;
            }
        }

        /**
         * @summary Checks if any of the adjacent cells are occupied by player
         * @param {Player} player the player to check
         * @returns {boolean} true if any of the adjacent cells are occupied by the given player
         */
        public anyAdjacentOccupiedBy(player: Player): boolean {
            let ret: boolean = false;
            for (let cell of this.listAdjacentCells) {
                if (cell.isOccupiedBy(player)) {
                    ret = true;
                    break;
                }
            }
            return ret;
        }

       /**
        * @summary Checks if any of the adjacent cells are occupied by the opponent player
        * @param {Player} player - the player to check
        * @returns true of any of the adjacent cells are occupied by the opponent player
        */
        public anyAdjacentOccupiedByOpponent(player: Player): boolean {
            let ret: boolean = false;
            for (let cell of this.listAdjacentCells) {
                if (cell.isOccupiedByOpponent(player)) {
                    ret = true;
                    break;
                }
            }
            return ret;
        }

        /**
         * @summary Checks if the cell is empty
         * @returns true if the cell is empty
         */
        public isEmpty(): boolean {
            return this.state === BoardCellState.Empty;
        }

        /**
         * @summary Checks if the cell is surrounded. A surrounded piece can not move
         * @returns true if the cell is surrounded by other pieces
         */
        public isSurrounded(): boolean {
            var ret:boolean = true;
            for (let cell of this.listAdjacentCells) {
                if (cell.isEmpty()) {
                    ret = false;
                    break;
                }
            }
            return ret;
        }

        /**
         * @summary - checks if a cell in the state of defender requesting two (exchange request)
         */
        isDefenderRequestingTwo(): boolean {
            return this.state === BoardCellState.OccupiedByDefenderRequestingTwo;
        }

        /**
         * @summary Checks if the cell is reachable by opponent players from any of the directions possible
         * @returns true if reachable. false if not
         */
        public isReachable(player: Player): boolean {
            let reachableFromUp: boolean = false;
         //   let emptyFoundUp = false;
            let ownPlayerFoundUp: boolean = false;

            let reachableFromRight: boolean = false;
          //  let emptyFoundRight = false;
            let ownPlayerFoundRight: boolean = false;

            let reachableFromLeft: boolean = false;
           // let emptyFoundLeft = false;
            let ownPlayerFoundLeft: boolean = false;

            let reachableFromBelow: boolean = false;
         //   let emptyFoundBelow = false;
            let ownPlayerFoundBelow: boolean = false;

            // check up until the edge
            let cell: BoardCell = this.Above();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundUp =true;
                    } else {
                        if (!ownPlayerFoundUp) {
                            reachableFromUp = true;
                            return true;
                        }
                        break;
                    }
                }
                cell = cell.Above();
            }

            // check right until the edge
            cell = this.Right();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundRight = true;
                    } else {
                        if (!ownPlayerFoundRight) {
                            reachableFromRight = true;
                            return true;
                        }
                        break;
                    }
                 }
                 cell = cell.Right();
            }

            // check left until the edge
            cell = this.Left();
            while (cell!= null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundLeft = true;
                    } else {
                        if (!ownPlayerFoundLeft) {
                            reachableFromLeft = true;
                            return true;
                        }
                        break;
                    }
                }
                cell = cell.Left();
            }

            // check below until the edge
            cell = this.Below();
            while (cell != null) {
                if (!cell.isEmpty()) {
                    if (cell.isOccupiedBy(player)) {
                        ownPlayerFoundBelow = true;
                    } else {
                        if (!ownPlayerFoundBelow) {
                            reachableFromBelow = true;
                        }
                        break;
                    }
                }
                cell = cell.Below();
            }

            return reachableFromUp || reachableFromBelow || reachableFromLeft || reachableFromRight;
        }


        /**
         * @summary Checks if the cell is capturable by an opponent player from any of the possible
         * directions
         * @param player the player to check
         * @returns true if it could be captured by the opponent
         */
        public isCapturable(player: Player): boolean {
            // check if occupied by the player
            if (!this.isOccupiedBy(player)) {
                return false;
            }

            // look at adjacent cells if it could be captured from the top
            if (this.Above() != null && this.Above().isEmpty() &&
                this.Below() != null && this.Below().isOccupiedByOpponent(player)) {
                if (this.Above().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }

             // look at adjacent cells if it could be captured from below
            if (this.Below() != null && this.Below().isEmpty() &&
                this.Above() != null && this.Above().isOccupiedByOpponent(player)) {
                if (this.Below().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }

            // look at adjacent cells if it could be captured from the left
            if (this.Left() != null && this.Left().isEmpty() && this.Right() != null &&
                this.Right().isOccupiedByOpponent(player)) {
                if (this.Left().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            // look at adjacent cells if it could be captured from right
            if (this.Right() != null && this.Right().isEmpty() && this.Left() != null &&
                this.Left().isOccupiedByOpponent(player)) {
                if (this.Right().anyAdjacentOccupiedByOpponent(player)) {
                    return true;
                }
            }
            return false;
        }

    }

}