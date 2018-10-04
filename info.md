
# Open Issues / To Do

* overall UI
    -- do we need a menu?
    -- menu links are not working - fixed
    -- modal dialogs do not work well in small devices
    -- Tab control -- is not ideal for mobile front end
    -- v2 version cleanup
* contact us --> my online objects
    created by field is empty       when user is not logged in
* System - move from UI of V1 or V2 and move to Own Html file  
    -- /html/system.html
    -- add link to main app 
    -- add Rules as link from main file
* Move Settings as part of the MyAccount function


* Exchange requests are not shown properly in the UI and -- debug
* highlighting of exchange requests disappears
* 

  https://stackoverflow.com/questions/7795300/validation-failed-for-one-or-more-entities-see-entityvalidationerrors-propert

* Save game state in the server  (azure doc or mongodb or something else)
* Loading a game after refresh is causing an error
* When a new game is started and pending another play to join. Please add a message with that info.
* Game state should be pending and not setting.  Should wait for another player to press play
  to start the game.
* Design something that matches player request for new games
* Update the game Status when the game is completed
* Un check the 'Resign' checkbox when a new game is started
* Add a dialog box when the game is over
* Add the account info
* fix the computer playing logic:
  * As Attacker
  * As Defender (ability to request for two)
    piece being played with
  * Deciding what to move if multiple captures are possible after capture on the move

* Ability to replay with a delay
* Ability to start a game with options (w/ computer, as Attacker,as Defender). 
* Add option to start the game with a time limit for each player (10, 20, 30 min).
* Fix two exchanges (add checks that the same piece is being selected for exchange)
* move the Checkbox related to two exchange close to each player (Attacker/Defender)
* Keep track of the player status  (player name is being lost)
* Add info in MyAccount tab: ScreenName, options, Games played
* Add timer to indicate the time spent by each player. The timer is started to indicate the turn of each player
* Fix the height of the messages list being added (add scroll bars)
* Make sure that logging works on the server and this is useful
* Add UI in the API site to view the log files
* Computer Play
  * Check that Pieces that are capturable and give these priority to move
  * Check that the result of a move does not result in a capturable piece
  * Check that the result of a move results in less capturables
  * case when computer is attacker and asking for Haff!! keeps moving the same piece. System needs to if repeating move more than three time ( add rule to mark the move as invalid)

* Detect Player blocked condition and allow the player to continue if it is not the first block
* Add ability to detect the number of times exchange requests are requested using the same piece and attacker     is not paying up (limit to 3)

* Add ability to indicate exchange request by dragging the piece off the board
* Add app menu Game - User:  Register, Login,  Game:  New, Save, Open, Abandon, 
* Display possible moves 
* Add Undo (Take back) and Redo
* Highlighting of possible moves
* play against the computer making random moves
* Enforce the rule related to blocking the defender after the first move.
  1 The Defender wins if they are blocked from moving after the first move or capture
* Program the two pieces exchanges UI
  * Add Two Exchange Request option (available on Defender's move)
  * The piece played by the defender when a two exchange request mode is on will be marked for exchange
  * The Attacker must respond either by accepting the exchange or not
  * If the attacker accepts the exchange, they need to mark accept the exchange checkbox and play two             consecutive moves to indicate free piece to use for the exchange
* Option for who starts first (defender or attacker )
* Add instruction for player for how to move
* Instead of dragging from spare pieces, add option to accept clicking a cell as an indication for setting on      that cell
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

## v 1.0 -- Oct 2018

### Features

* Online Web Access (www.kharbga.net)
* Ability to play with computer as attacker or defender
* Ability to play with another player over the net

### Issues Resolved

* Setup on www.kharbga.net
* v1 - jquery version
* v2 - AngualrJS version
* Error about invalid setting -- fixed
* Error creating game when user is not logged in - issue with the game 


## v 0.1  -- Apr 30, 2017

### Features

* Online Web Access (www.kharbga.net)
* Ability to play on a single computer

### Resolved Issues

  1. Display the number settings left for each player after each turn. Added messages
  2. Display the number of spare pieces remaining off board  -- not needed?
  3. Display the player score (number of pieces on board)
  4. Enforce settings rules
  5. Ability to start the board and the game with a specific state of the game (fen)
  6. Enforce moving and capturing rules
  7. Display the Malha image while on setting
  8. Remove the Malha image after setting is completed
  9. Update the game state at the end of the setting phase
  10. Enforced the rule that a player must continue moving the same piece until no capture is possible
  11. UI enhancements to the board cell
  12. Messages improvements indicating which move is required.
  13. Added logic to detect condition when attacker can not move at the beginning of the game (automatic loss - bad setting)
  14. Resolve the issue when the game is won by abandon -- recorded the move to the server

---

## Compiling TypeScript

- tsc    (src directory)

## References
* [http://www.the-art-of-web.com/html/html5-form-validation/]
* [https://jqueryvalidation.org/documentation/]
* https://stackoverflow.com/questions/23375043/best-practice-for-reconnecting-signalr-2-0-net-client-to-server-hub