import windowObservable from "../../WindowObservable.js";

class WaitingRoomPageManager {
	constructor(app, clientInfo, onExitWaitingRoom) {
		console.log("Waiting Room Page!");
		this.clientInfo = clientInfo;
		this.onExitWaitingRoom = onExitWaitingRoom;

		// TODO : 임시 하드 코딩
		this.teamLeftList = [{
			clientId: 1,
			clientNickname: "김뱀파이어",
			readyState: "NOTREADY"
		}];
		this.teamRightList = [{
			clientId: 2,
			clientNickname: "철수",
			readyState: "READY"
		}, {
			clientId: 3,
			clientNickname: "영희",
			readyState: "READY"
		}];

		this.clientInfo.id = 3;
		this.title = "개쩌는 탁구장";
		this.leftMode = "vampire";
		this.rightMode = "human";

		app.innerHTML = this._getHTML();

		this.leftReadyText = document.querySelector('.teamPanel:first-of-type .readyText');
		this.rightReadyText = document.querySelector('.teamPanel:last-of-type .readyText');

		const orientation = windowObservable.getOrientation();
		this._toggleReadyTextVisible(orientation);
		this._subscribeWindow();
		// this.clientInfo.socket.addEventListener('click', this.onExitWaitingRoom);
	}

	_subscribeWindow() {
		this.toggleReadyTextVisibleRef = this._toggleReadyTextVisible.bind(this);
		windowObservable.subscribeOrientationChange(this.toggleReadyTextVisibleRef);
	}

	_toggleReadyTextVisible(orientation) {
		if (orientation === 'landscape') {
			this.leftReadyText.classList.remove('invisible');
			this.rightReadyText.classList.remove('invisible');
		} else if (orientation === 'portrait') {
			this.leftReadyText.classList.add('invisible');
			this.rightReadyText.classList.add('invisible');
		}
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				<div id="header">
					<div id="title">${this.title}</div>
					<div id="mode">${this._getMode()}</div>
				</div>
				<div id="panel">
					${this._getTeamPanelHTML(this.leftMode, this.teamLeftList)}
					<div id="vsText">VS</div>
					${this._getTeamPanelHTML(this.rightMode, this.teamRightList)}
				</div>
				<button class="generalButton" id="readyButton">Ready</button>
			</div>
		`;
	}
	_getMode() {
		const left = this.leftMode === "vampire" ? "뱀파이어" : "인간";
		const right = this.rightMode === "vampire" ? "뱀파이어" : "인간";
		return `${left} VS ${right} 모드`;
	}

	_getTeamPanelHTML(mode, teamList) {
		let infoHTML;
		if (teamList.length === 1) {
			infoHTML = this._getPlayerInfoHTML(mode, teamList[0]);
		} else if (teamList.length >= 2) {
			infoHTML = this._getPlayerInfoListHTML(teamList);
		}
		const readyAll = teamList.every((player) => player.readyState === 'READY');
		return `
			<div class="teamPanel">
				<div class="status">
					<img class="teamIcon ${mode}Icon" src="images/${mode}Icon.png">
					<div class="readyText">
						Ready!
						<div class="readyStroke ${readyAll ? 'on' : ''}">Ready!</div>
					</div>
				</div>
				<div class="info">${infoHTML}</div>
			</div>
		`;
	}

	_getPlayerInfoHTML(mode, player) {
		const abilityBtnHTML = '<button class="abilityButton generalButton">능력<br>선택</button>';
		return `
			<div class="nameContainer">
				<div class="name">${player.clientNickname}</div>
			</div>
			<div class="avatar">
				${mode === 'vampire' ? abilityBtnHTML : ''}
				<div class="avatarImgFrame">
					<img class="avatarImg ${player.readyState === 'READY' ? 'on' : ''}" src="images/playerA.png">
				</div>
			</div>
		`;
	}

	// _getPlayerInfoListHTML(playerList) {
	// 	let listHTML = '';
	// 	playerList.forEach((player) => { // TODO : 아직 들어오지 않은 자리 구현 (?)
	// 		listHTML += this._getPlayerInfoItemHTML(player);
	// 	});
	// 	for (let i = 0; i < 5 - playerList.length; i++) {
	// 		listHTML += this._getEmptyInfoItemHTML();
	// 	}
	// 	return listHTML;
	// }
	// _getPlayerInfoItemHTML(player) {
	// 	return `
	// 		<div class="listItem ${player.clientId === this.clientInfo.id ? 'me' : ''}">
	// 			<div class="avatarImgFrame">
	// 				<img class="avatarImg ${player.readyState === 'READY' ? 'on' : ''}" src="images/playerA.png">
	// 			</div>
	// 			<div class="listName">${player.clientNickname}</div>
	// 		</div>
	// 	`;
	// }
	// _getEmptyInfoItemHTML() {
	// 	return `
	// 		<div class="listItem">
	// 			<div class="avatarImgFrame">
	// 				<div class="diagonal-1"></div>
	// 				<div class="diagonal-2"></div>
	// 			</div>
	// 		</div>
	// 	`;
	// }

	_getPlayerInfoListHTML(playerList) {
		let listHTML = '';
		playerList.forEach((player) => {
			listHTML += `
				<div class="listItem ${player.clientId === this.clientInfo.id ? 'me' : ''}">
					${this._getPlayerInfoItemHTML(player)}
				</div>`;
		});
		for (let i = 0; i < this.totalPlayerCount - playerList.length; i++) {
			listHTML += `<div class="listItem">${this._getEmptyItemHTML()}</div>`;
		}
		for (let i = 0; i < 5 - this.totalPlayerCount; i++) {
			listHTML += `<div class="listItem">${this._getXItemHTML()}</div>`;
		}
		return listHTML;
	}
	_getPlayerInfoItemHTML(player) {
		return `
			<div class="avatarImgFrame">
				<img class="avatarImg ${player.readyState === 'READY' ? 'on' : ''}" src="images/playerA.png">
			</div>
			<div class="listName">${player.clientNickname}</div>
		`;
	}
	_getEmptyInfoItemHTML() {
		return `
			<div class="avatarImgFrame">
				<div class="diagonal-1"></div>
				<div class="diagonal-2"></div>
			</div>
		`;
	}

}

export default WaitingRoomPageManager;