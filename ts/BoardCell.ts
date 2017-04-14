namespace Kharbga{
	/**
	 * @summary Represents a Kharbga Board cell.
	 * A Board is 
	 */
    export class BoardCell {
        /* Display Labels */
        static TopLabels = ["\u0623", "\u0628", "\u062A", "\u062B", "\u062C", "\u062D", "\u062E"];
        static BottomLabels = ["A", "B", "C", "D", "E", "F", "G"];
        board: Board;

        public static COLUMNS = 'abcdefg'.split('');
        public static ROWS = '1234567'.split('');

        row: number;   // 0 to 6
        col: number;   // 0 to 6
        id: string;    // this is the location following the notation column label followed by row label
        // examples: a1, b2, d3, etc. 

        state: BoardCellState = BoardCellState.Empty;

        left: BoardCell = null;
        right: BoardCell = null;
        up: BoardCell = null;
        down: BoardCell = null;

        listAdjacentCells: BoardCell[];

        /**
         * @summary Board cells are created on a board of size 7 x 7
         * @param b the board
         * @param row: 0-6
         * @param col: 0-6
         */
        constructor(b: Board, row: number, col: number) {
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
        Row(): number {
            return this.row;
        }

        /**
         * Returns The col from 0-6
         */
        Col(): number {
            return this.col;
        }

        /**
         * the ID in the format "ColRow" where Col are letters from a-g or alif to to kha.
         * and Row from 1-7
         */
        ID(): string {
            return this.id;
        }

        /**
         * Returns the cell above or null if on the top edge
         */
        Above(): BoardCell {
            return this.up;
        }

        /**
         * Returns the cell below or null if on the bottom edge
         */
        Below(): BoardCell {
            return this.down;
        }

        /**
         * Returns the cell to the right or null if on the right edge
         */
        Right(): BoardCell {
            return this.right;
        }

        /**
         * Returns cell to the left or null if on the left edge
         */
        Left(): BoardCell {
            return this.left;
        }

        /**
         * Returns the current cell state
         */
        State(): BoardCellState {
            return this.state;
        }

        /**
         * Checks if the current cell is occupied or not
         */
        IsOccupied(): boolean {
            return this.state != BoardCellState.Empty;
        }

        /**
         * Checks if the current cell is occupied by an attacker piece or not
         */
        IsOccupiedByAttacker(): boolean {
            return this.state == BoardCellState.OccupiedByAttacker;
        }


        /**
         * Checks if the current cell is occupied by a defender piece or not
         */
        IsOccupiedByDefender(): boolean {
            return this.state == BoardCellState.OccupiedByDefender;
        }

        /**
         * Check id the current cell is the middle cell which is left empty after each player sets their peices on the board
         * Malha means salty in Arabic.  Players are not allowed to set (seed) their piece on the salty land.
         */
        IsMalha(): boolean {
            if (this.row == 3 && this.col == 3)
                return true;
            else
                return false;
        }

		

        /**
         * Set a piece on the board with either an attacker or a defender piece
         * @param playerIsAttacker indicates whether an attacker or a defender setting
         */
        SetPiece(playerIsAttacker: boolean): void {
            if (playerIsAttacker)
                this.state = BoardCellState.OccupiedByAttacker;
            else
                this.state = BoardCellState.OccupiedByDefender;
        }

        /**
         *  set a piece with the same state as the give cell
         * @param cell
         */
        SetSameAs(cell: BoardCell): void {
            this.state = cell.state;
        }

        /**
         * Determines the adjacent cells and sets then for easy access from each cell 
         */
        SetAdjacentCells(board: Board) {
            // add check if board is null

            if (board == null) {
                alert("board is null");
                //TODO: add debugging logic here
                return;
            }

            // On the same row back;
            if (this.col - 1 >= 0) {
                this.left = board.GetCell(this.Row(), this.Col() - 1);
                if (this.left != null)
                    this.listAdjacentCells.push(this.left);
            }

            // On the same row forward
            if (this.col + 1 <= 6) {
                this.right = board.GetCell(this.Row(), this.Col() + 1);
                if (this.right != null)
                    this.listAdjacentCells.push(this.right);
            }

            // On the same col up;
            if (this.row - 1 >= 0) {
                this.up = board.GetCell(this.Row() - 1, this.Col());
                if (this.up != null)
                    this.listAdjacentCells.push(this.up);
            }

            // On the same col down;
            if (this.row + 1 <= 6) {
                this.down = board.GetCell(this.Row() + 1, this.Col());
                if (this.down != null)
                    this.listAdjacentCells.push(this.down);
            }
        }

        /**
         * Returns the adjacent cells
         */
        GetAdjacentCells(): BoardCell[] {
            return this.listAdjacentCells;
        }

        /**
         * Checks if the give cell is adjacent to this one
         * @param cell
         */
        IsAdjacentTo(cell: BoardCell): boolean {
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

        Clear() {
            this.state = BoardCellState.Empty;
        }

        IsOccupiedBy(player: Player): boolean {
            switch (this.state) {
                case BoardCellState.Empty:
                    return false;
                case BoardCellState.OccupiedByAttacker:
                    return player.IsAttacker();
                case BoardCellState.OccupiedByDefender:
                    return player.IsDefender();
                default:
                    return false;
            }
        }


        IsEmpty(): boolean {
            return this.state == BoardCellState.Empty;
        }

        /**
         * A surrounded piece can not move
         */
        IsSurrounded(): boolean {
            var ret = true;
            this.listAdjacentCells.forEach(function (e) {
                if (e.IsEmpty) {
                    ret = false;
                    return;
                }

            });

            return ret;
        }

        IsDefenderRequestingTwo(): boolean {
            return this.state == BoardCellState.OccupiedByDefenderRequestingTwo;
        }

    }

}