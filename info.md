
# Open Issues / To Do:
---
* Add app menu Game - User:  Register, Login,  Game:  New, Save, Open, Abandon, 
* Display possible moves 
* Add Undo (Take back) and Redo
* Highlihting of possible moves
* Enforce the rule related to blocking the defender after the first move.
  1 The Defender wins if they are blocked from moving after the first move or capture
* Program the two pieces exchanges UI
    - Add Two Exchange Request option (available on Defender's move)
    - The piece played by the defender when a two exchange request mode is on will be marked for exchange
    - The Attacker must respond either by accepting the exchange or not
    - If the attacker accepts the exchange, they need to mark accept the exchange checkbox and play two consecutives moves to indicate free piece to use for the exchange
* Option for who starts first (defender or attacker )

* Add instruction for player for how to move
* Instead of dragging from spare pieces, add option to accept clicking a cell as an indication for setting on that cell 
* Disable selecting spare pieces 
* Choose the type of game to play:

	1 players using the same computer 
	2 players using different computers  (networking functions)
	3 
* make sure all UI messages/strings are translatable (change depending on language selection)
* Add documentation about game rules
* Display game history
* Reply a game history

* Clear selections at the end of a game 
    1 after a player abandons due to inability to move
    2 after an attacker abandons due to inability to pay defender
    3 a player's score reaches zero
*  Add end of the game moves to the Move History
*  Add Untouchable Payment move to the History

* Remove the pass button. 
* Evaluate the player's possible moves at the beginning of their turn
    1 Automatic pass if the player does not have a move
    2 Highlight possible moves
    3 Highlight pieces that could be captured

* Ability to play with other players over  the network
* Ability to play against the computer (artificial intelligence)
    1 Generate settings
    2 Identify moves
    
* Ability to watch a game being played by other players over the network
* Ability to store games on the server
* Ability to access stored games (site security)
    1 user account information (players)
	2 games API
	3 game info to store: players, settings, fen after setting, moves, winner, start time, end time
	4
* Ability to replay a stored game
* Ability to organize tournaments
* Integration with Facebook
* Mobile App version  (Cordova / Xamarin)

* Ability to undo a previous setting or move.
    - board level (stored game)
    - user local view update

* Add option to support different size board: 5x5 and 9x9

# Dev Release Notes:
---
## v 0.1  -- Apr 30, 2017

Features:
- Online Web Access (www.kharbga.net)
- Ability to play on a single computer 

* Resolved Issues:
  1. Display the number settings left for each player after each turn. Added messages
  2. Display the number of spare pieces remaining off board  -- not needed?
  3. Display the player score (number of pieces on board) 
  4. Enforce settings rules
  5. Ability to start the board and the game with a specific state of the game (fen)   
  6. Enforce moving and capturing rules
  7. Display the Malha image while on setting
  8. Remove the Malha image after setting is completed
  9.  Update the game state at the end of the setting phase 
  10. Enforced the rule that a player must continue moving the same piece until no capture is possible
  11. UI enhacements to the board cell 
  12. Messages improvements indicating which move is required.

# Compiling TypeScript 
- tsc    (src directory)
