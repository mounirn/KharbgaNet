
# Open Issues / To Do:
---
* Enforce the rule related to blocking the defender after the first move.
  1 The Defender wins if they are blocked from moving after the first move or capture
* Enforce two exchanges  (or leave as an option)
* Option for who starts first (defender or attacker )
* Display the Malha image while on setting
* Remove the Malha image after setting is completed
* Update the game setting at the end of the setting phase -- done
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
	1 Display the number settings left for each player after each turn -- done (message)
	2 Display the number of spare pieces remaining off board  -- not needed?
	3 Display the player score (number of pieces on board) -- done
	4 Enforce settings rules
	5 Ability to start the board and the game with a specific state of the game (fen)   -- Done
    6 Enforce moving and capturing rules

# Compiling TypeScript 
- tsc    (src directory)
