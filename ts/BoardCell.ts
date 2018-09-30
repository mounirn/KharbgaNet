namespace Kharbga{
	/**
	 * @summary Represents a Kharbga Board cell.
	 * A Board is 
	 */
    export class BoardCell {
        /* Display Labels */
        static TopLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
        static BottomLabels = ["A", "B", "C", "D", "E", "F", "G"];
        private board: Board;

        public static COLUMNS = 'abcdefg'.split('');
        public static ROWS = '1234567'.split('');

        private row: number;   // 0 to 6
        private col: number;   // 0 to 6
        public id: string;    // this is the location following the notation column label followed by row label
        // examples: a1, b2, d3, etc. 

        private state: BoardCellState = BoardCellState.Empty;

        public left: BoardCell = null;
        public right: BoardCell = null;
        public up: BoardCell = null;
        public down: BoardCell = null;

        private listAdjacentCells: BoardCell[];

        /**
         * @summary Board cells are created on a board of size 7 x 7
         * @param b the board
         * @param row: 0-6
         * @param col: 0-6
         */
        public constructor(b: Board, row: number, col: number) {
            if (row < 0 || row > 6)
                alert("invalid board row: " + row);
            if (col < 0 || col > 6)
                alert("invalid board col: " + col); 

            this.board = b;
            this.row = row;
            this.col = col;

            this.id = BoardCell.COLUMNS[col] + BoardCell.ROWS[row];

            this.listAdjacentCells = [];

        }

        /**
         *  Returns the row 0-6
         */
        public Row(): number {
            return this.row;
        }

        /**
         * Returns The col from 0-6
         */
        public Col(): number {
            return this.col;
        }

        /**
         * the ID in the format "ColRow" where Col are letters from a-g or alif to to kha.
         * and Row from 1-7
         */
        public ID(): string {
            return this.id;
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
            return this.state == BoardCellState.OccupiedByDefender;
        }

        /**
         * Check id the current cell is the middle cell which is left empty after each player sets their peices on the board
         * Malha means salty in Arabic.  Players are not allowed to set (seed) their piece on the salty land.
         */
        public isMalha(): boolean {
            if (this.row == 3 && this.col == 3)
                return true;
            else
                return false;
        }

		

        /**
         * Set a piece on the board with either an attacker or a defender piece
         * @param playerIsAttacker indicates whether an attacker or a defender setting
         */
        public setPiece(playerIsAttacker: boolean): void {
            if (playerIsAttacker)
                this.state = BoardCellState.OccupiedByAttacker;
            else
                this.state = BoardCellState.OccupiedByDefender;
        }

        /**
         *  set a piece with the same state as the give cell
         * @param cell
         */
        public setSameAs(cell: BoardCell): void {
            this.state = cell.state;
        }

        /**
         * Determines the adjacent cells and sets them for easy access from each cell 
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
                this.left = board.getCell(this.Row(), this.Col() - 1);
                if (this.left != null)
                    this.listAdjacentCells.push(this.left);
            }

            // on the same row forward
            if (this.col + 1 <= 6) {
                this.right = board.getCell(this.Row(), this.Col() + 1);
                if (this.right != null)
                    this.listAdjacentCells.push(this.right);
            }

            // On the same col up;
            if (this.row - 1 >= 0) {
                this.up = board.getCell(this.Row() - 1, this.Col());
                if (this.up != null)
                    this.listAdjacentCells.push(this.up);
            }

            // On the same col down;
            if (this.row + 1 <= 6) {
                this.down = board.getCell(this.Row() + 1, this.Col());
                if (this.down != null)
                    this.listAdjacentCells.push(this.down);
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
            let ret = false;
            for (var i = 0; i < this.listAdjacentCells.length; i++) {
                let adjCell = this.listAdjacentCells[i];
                if (adjCell == cell) {
                    ret = true;
                    break;
                }
            };

            return ret;
        }

        public clear() {
            this.state = BoardCellState.Empty;
        }

        public isOccupiedBy(player: Player): boolean {
            switch (this.state) {
                case BoardCellState.Empty:
                    return false;
                case BoardCellState.OccupiedByAttacker:
                    return player.isAttacker();
                case BoardCellState.OccupiedByDefender:
                    return player.isDefender();
                default:
                    return false;
            }
        }

        public isOccupiedByOpponent(player: Player): boolean {
            switch (this.state) {
                case BoardCellState.Empty:
                    return false;
                case BoardCellState.OccupiedByAttacker:
                    return player.isDefender();
                case BoardCellState.OccupiedByDefender:
                    return player.isAttacker();
                default:
                    return false;
            }
        }

        /**
         * Checks if any of the adjacent cells are occupied by player
         * @param player
         */
        public anyAdjacentOccupiedBy(player: Player): boolean {
            let ret = false;
            for (let cell of this.listAdjacentCells) {
                if (cell.isOccupiedBy(player)) {
                    ret = true;
                    break;
                }
            }
            return ret;
        }

        /**
      * Checks if any of the adjacent cells are occupied by player
      * @param player
      */
        public anyAdjacentOccupiedByOpponent(player: Player): boolean {
            let ret = false;
            for (let cell of this.listAdjacentCells) {
                if (cell.isOccupiedByOpponent(player)) {
                    ret = true;
                    break;
                }
            }
            return ret;
        }

        /**
         * Checks if the cell is empty
         * @returns true if the cell is empty
         */
        public isEmpty(): boolean {
            return this.state == BoardCellState.Empty;
        }

        /**
         * Checks if the cell is surrounded. A surrounded piece can not move
         */
        public isSurrounded(): boolean {
            var ret = true;
            for (let cell of this.listAdjacentCells) {
                if (cell.isEmpty()) {
                    ret = false;
                    break;
                }
            }

            return ret;
        }

        /**
         * not used 
         */
        isDefenderRequestingTwo(): boolean {
            return this.state == BoardCellState.OccupiedByDefenderRequestingTwo;
        }

        /**
         * Checks if the cell is reachable by opponent players from any of the directions possible
         * @returns true if reachable. false if not
         */
        public isReachable(player: Player): boolean {
            
            let reachableFromUp = false;  
            let emptyFoundUp = false;
            let ownPlayerFoundUp = false;

            let reachableFromRight = false;
            let emptyFoundRight = false;
            let ownPlayerFoundRight = false;

            let reachableFromLeft = false;
            let emptyFoundLeft = false;
            let ownPlayerFoundLeft = false;

            let reachableFromBelow = false;
            let emptyFoundBelow = false;
            let ownPlayerFoundBelow = false;

            // check up until the edge
            let cell = this.Above();
            while (cell != null) {       
                if (cell.isEmpty())
                    emptyFoundUp = true;
                else {
                    if (cell.isOccupiedBy(player))
                        ownPlayerFoundUp;
                    else {
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
                if (cell.isEmpty())
                    emptyFoundRight = true;
                else {
                    if (cell.isOccupiedBy(player))
                        ownPlayerFoundRight;
                    else {
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
                if (cell.isEmpty())
                    emptyFoundLeft = true;
                else {
                    if (cell.isOccupiedBy(player))
                        ownPlayerFoundLeft;
                    else {
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
                if (cell.isEmpty())
                    emptyFoundBelow = true;
                else {
                    if (cell.isOccupiedBy(player))
                        ownPlayerFoundBelow;
                    else {
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
         * Checks if the cell is capturable by an opponent player from any of the possible 
         * @param player
         */
        public isCapturable(player: Player): boolean {
            if (!this.isOccupiedBy(player))
                return false; 

            // look at adjacent cells 
            if (this.Above() != null && this.Above().isEmpty() && this.Below() != null && this.Below().isOccupiedByOpponent(player)) {
                if (this.Above().anyAdjacentOccupiedByOpponent(player))
                    return true;
            }

            if (this.Below() != null && this.Below().isEmpty() && this.Above() != null && this.Above().isOccupiedByOpponent(player)) {
                if (this.Below().anyAdjacentOccupiedByOpponent(player))
                    return true;
            }

            if (this.Left() != null && this.Left().isEmpty() && this.Right() != null && this.Right().isOccupiedByOpponent(player)) {
                if (this.Left().anyAdjacentOccupiedByOpponent(player))
                    return true;
            }

            if (this.Right() != null && this.Right().isEmpty() && this.Left() != null && this.Left().isOccupiedByOpponent(player)) {
                if (this.Right().anyAdjacentOccupiedByOpponent(player))
                    return true;
            }

            return false;
        }

    }

}