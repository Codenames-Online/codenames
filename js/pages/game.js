/**
 * Code for the game page/section, where the user actually plays the
 * game. This page handles all of the game UX. Including letting users
 * submit clues and guesses, redrawing the board when guesses come in
 * or when cards are revealed, and showing game end conditions.
 */

// Takes in [[color, Card],[color,Card]]
// Each card is {word: string, votes: string[], revealed: boolean}
// Colors are of form `{0: blue, 1: red, 2: bystander, 3: assassin}`
function drawBoard(board) {
	// Clear board
	$('.board .card').remove();

	var currCard, currColor, $card, $iconCont;

	for(var i = 0; i < board.length; i++) {
		currColor = board[i][0];
		currCard = board[i][1];

		// Add each card using the word
		$('.board').append('<div class="card selectable" data-index="' + i + '">' +
			'<span>' + currCard.word + '</span>' +
			'<div class="overlay">' +
				'<div class="icon-cont"></div>' +
			'</div>' +
		'</div>');

		$card = $('.board .card').last(); // store card we just insterted

		// Add selection by class .selected and appending div.team-select or div.self-select into .overlay .icon-cont
		if(currCard.votes.length > 0) {
			$card.addClass('selected');
			$iconCont = $card.find('.icon-cont');

			// iterate through votes and add proper icon
			for(var v = 0; v < currCard.votes.length; v++) {
				if(currCard.votes[v] == me.name)
					$iconCont.prepend('<div class="self-select"></div>')
				else
					$iconCont.prepend('<div class="team-select"></div>')
			}
		}

		// Add data-agent for colors and data-revealed to revealed cards
		if(currColor == BLUE)
			$card.attr('data-agent', 'blue');
		else if(currColor == RED)
			$card.attr('data-agent', 'red');
		else if(currColor == ASSASSIN)
			$card.attr('data-agent', 'black');
		else if(currColor == NEUTRAL)
			$card.attr('data-agent', 'neutral');

		if(currCard.revealed)
			$card.attr('data-revealed', 'true')
	}

	$('.board .card').click(toggleCard);
}

function setScore(score) {
	$('.score.red').html(score[1]);
	$('.score.blue').html(score[0]);
}

function changeTurn(team) {
	if(me.role == OP || me.team != team) // set the header to indicate the spymaster is working if not spymaster
		setHeader(team);
	else // just set color, since it swapped
		$('.clue').attr('data-team', getTeamString(team));

	$('.guess-panel').hide(); // hide guess panel
	$('.clue .team-sect').removeClass('your-turn'); // remove .your-turn class on .team-sect
	$('.board').attr('data-team', getTeamString(team));
}

function sendMessage() {
	var message = $('.send-msg input[type="text"]').val();
	message = escapeHtml(message); // escape message for safety
	sendSocket({ action: 'sendMessage', text: message });
	$('.send-msg input[type="text"]').val('');
}

function addMessage(message, name, team) {
	let teamString = team === RED ? "red" : "blue";
	let maybeSelf = name === me.name ? ' data-self="true"' : "";
	$('.chat .msg-cont').append(
		`<div class="msg" data-team="${teamString}"${maybeSelf}>
			<div class="body">${message}</div>
			<div class="author">${name}</div>
		</div>`
	);

	// Scroll to bottom
	$(".msg-cont").scrollTop($(".msg-cont")[0].scrollHeight);
}

function setHeader(team, clue) {
	$('.clue').attr('data-team', getTeamString(team));
	$('.clue .text').html(getHeader(team, clue));
}

// Shows the dialog for the spymaster to enter a clue
function showClueInput() {
	$('.clue .text').html('<div class="center">' +
		'Give a one word clue: <input type="text" id="clue-word"> ' +
		'# of cards: <input type="number" min=0 max=9 id="clue-num"> <button class="btn green" id="clue-submit">Submit</button>' +
	'</div>');

	$('.clue .team-sect .turn-text').text('Your turn, spymaster');
	$('.clue .team-sect').addClass('your-turn');

	$('#clue-submit').click(sendClue);
	$('#clue-num').enterPress(sendClue); // pressing enter in the number field should send the clue
}

// Reads in the spymaster fields and sends a clue action
function sendClue() {
	var data = {
		clue: { word: $('#clue-word').val(), num: $('#clue-num').val() },
		action: 'sendClue'
	}

	sendSocket(data);
}

// Occurs if spymaster tries to submit invalid clue
function invalidClueWord(reason) {
	if(reason == "wordOnBoard") {
		showOverlay('word-on-board');
	}
	else if(reason == "notWord") {
		showOverlay('not-in-dict');
	}
}

function invalidClueNum() {
	showOverlay('invalid-num-guesses');
}

// It's this user's turn - shows the panel for submitting a guess
function showGuessPanel(team, clue) {
	setHeader(team, clue);

	$('#submit-guess').addClass('disabled'); // start with the button disabled, since no one has voted

	if(me.team == team && me.role == OP) {
		$('.clue .team-sect .turn-text').text('Your turn, operative');
		$('.clue .team-sect').addClass('your-turn');
		$('.guess-panel').show();
	}
	else {
		$('.clue .team-sect').removeClass('your-turn');
		$('.guess-panel').hide();
	}
}

function submitGuess() {
	if($('#submit-guess.disabled').length == 0) // submit if button is not disabled
		sendSocket({action: "submitGuess"});
}

function allowGuess(bool) {
	if(bool)
		$('.guess-panel #submit-guess').removeClass('disabled')
	else
		$('.guess-panel #submit-guess').addClass('disabled')
}

function toggleCard() {
	sendSocket({ action: "toggleCard", cardIndex: $(this).attr('data-index') });
}


// Takes in an array of {name: name, role: role, team: team} objects
function setupTeamRoster(roster) {
	var currPlayer, $roster;

	for(var i = 0; i < roster.length; i++) {
		currPlayer = roster[i];

		if(currPlayer.team === BLUE)
			$roster = $('.side-roster .roster.blue .players');
		else if(currPlayer.team === RED)
			$roster = $('.side-roster .roster.red .players');

		if(currPlayer.role == SPY) // spymaster
			$roster.prepend('<div class="player spymaster"><div class="eye" title="Spymaster"></div>' + currPlayer.name + '</div>');
		else
			$roster.append('<div class="player">' + currPlayer.name + '</div>');
	}
}

function endTurn() {
	sendSocket({action: 'endTurn'});
}

function gameOver(team) {
	if(team == BLUE)
		showOverlay('end-game-blue');
	else if(team == RED)
		showOverlay('end-game-red');
}
