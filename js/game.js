function goToGame() {
	$('.roster-page-cont').fadeOut(function() {
		$('.game-page-cont').fadeIn();
	});	
}

// Takes in {cards: Card[], colors: number[], startTeam: team}
// Each card is {word: string, votes: string[], revealed: boolean}
// Colors are of form `{0: blue, 1: red, 2: bystander, 3: assassin}`
function drawBoard(board) {
	// Clear board
	$('.board .card').remove();

	// Add each card using the word 
	var currCard;
	for(var i = 0; i < board.cards.length; i++) {
		currCard = board.cards[i];

		$('.board').append('<div class="card selectable">' +
			'<span>' + currCard.word + '</span>' +
			'<div class="overlay">' +
				'<div class="icon-cont"></div>' +
			'</div>' +
		'</div>');
	}
	
	// Add selection by class .selected and appending div.team-select or div.self-select into .overlay .icon-cont 
	// Add data-agent for colors and data-revealed to revealed cards
}

function changeTurn(team) {
	setHeader(team);
}

function sendMessage() {
	var message = $('.send-msg input').val();
	socket.send({ action: "sendMessage", message: message });
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
}

function setHeader(team, clue) {
	$('.clue').attr('data-team') = getTeamString(team);
	$('.clue').html(getHeader(team, clue));
}