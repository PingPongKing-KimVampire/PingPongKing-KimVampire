import windowObservable from '../../WindowObservable.js';

import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class WaitingRoomPageManager {
	constructor(app, clientInfo, _onStartPingpongGame, _onExitWaitingRoom) {
		this.app = app;
		this._onStartPingpongGame = _onStartPingpongGame;
		this._onExitWaitingRoom = _onExitWaitingRoom;
		console.log("Waiting Room Page!");
		this.clientInfo = {
			socket: null,
			id: null,
			nickname: null,
			lobbySocket: null,
			gameInfo: {
				pingpongRoomSocket: null,
				roomId: null,
				title: null,
				teamLeftList: null,
				teamRightList: null,
				teamLeftMode: null,
				teamRightMode: null,
				teamLeftTotalPlayerCount: null,
				teamRightTotalPlayerCount: null,
				teamLeftAbility: null,
				teamRightAbility: null,
			},
		};

		// const playerInfo = {
		// 	clientId: null,
		// 	clientNickname: null,
		// 	readyState: null
		// }
		this.clientInfo = clientInfo;

		this._setMeInfo();
		this._initPage();
		this._listenWaitingRoomEvent();
	}

	_setMeInfo() {
		// 자신의 팀, 모드, 준비 상태 알아오기
		this.me = {
			team: null,
			mode: null,
			readyState: null,
			selectAbility: false
		}
		let myPlayer = this.clientInfo.gameInfo.teamLeftList.find((player) => player.clientId === this.clientInfo.id);
		if (myPlayer) {
			this.me.readyState = myPlayer.readyState;
			this.me.team = 'left';
		} else {
			myPlayer = this.clientInfo.gameInfo.teamRightList.find((player) => player.clientId === this.clientInfo.id);
			this.me.readyState = myPlayer.readyState;
			this.me.team = 'right';
		}
		this.me.mode = this.me.team === 'left' ? this.clientInfo.gameInfo.teamLeftMode : this.clientInfo.gameInfo.teamRightMode;
	}
	_initPage() {
		this.app.innerHTML = this._getHTML();

		this.leftReadyText = document.querySelector(
			".teamPanel:first-of-type .readyText"
		);
		this.rightReadyText = document.querySelector(
			".teamPanel:last-of-type .readyText"
		);

		const orientation = windowObservable.getOrientation();
		this._toggleReadyTextVisible(orientation);
		this._subscribeWindow();
		document
			.querySelector("#readyButton")
			.addEventListener("click", (event) => {
				this._sendMyReadyStateChangeMessage.call(this);
			});
		this._manageExitRoom();
		this._setAbilityButtons();
	}

	//login 페이지와 중복되는 로직임. 어떻게 공유할 것인지 생각해야함.
	//loginPage의 static 메서드로 만드는것은 어떨까?
	//this바인딩해서 주면 괜찮을듯
	async _connectLobbySocket(id) {
		const lobbySocket = new WebSocket(
			`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`
		);
		await new Promise((resolve) => {
			lobbySocket.addEventListener("open", () => {
				resolve();
			});
		});
		const enterLobbyMessage = {
			event: "enterLobby",
			content: {
				clientId: id,
			},
		};
		lobbySocket.send(JSON.stringify(enterLobbyMessage));

		await new Promise((resolve) => {
			lobbySocket.addEventListener(
				"message",
				function listener(messageEvent) {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "enterLobbyResponse" && content.message === "OK") {
						lobbySocket.removeEventListener("message", listener);
						resolve();
					}
				}.bind(this)
			);
		});

		return lobbySocket;
	}

	_setAbilityButtons() {
		this.abilityModal = document.querySelector('.abilitySelectionModal');
		const leftAbilityButton = document.querySelector('.teamPanel:first-of-type .abilityButton');
		const rightAbilityButton = document.querySelector('.teamPanel:last-of-type .abilityButton');
		if (this.me.team === 'left') {
			this.myAbilityButton = leftAbilityButton;
			this.opponentAbilityButton = rightAbilityButton;
		} else {
			this.myAbilityButton = rightAbilityButton;
			this.opponentAbilityButton = leftAbilityButton;
		}
		if (this.myAbilityButton) {
			this.myAbilityButton.addEventListener('click', this._displayAbilityModal.bind(this));
		}
	}

	_listenWaitingRoomEvent() {
		const listener = (messageEvent) => {
			const message = JSON.parse(messageEvent.data);
			const { event, content } = message;
			if (event === "notifyWaitingRoomEnter") {
				const { clientId, clientNickname, team } = content;
				this._pushNewPlayer(clientId, clientNickname, team);
				this._initPage();
			} else if (event === "notifyWaitingRoomExit") {
				const clientId = content.clientId;
				this._popPlayer(clientId);
				this._initPage();
			} else if (event === "notifyReadyStateChange") {
				const { clientId, state } = content;
				this._updateReadyState(clientId, state);
				if (clientId === this.clientInfo.id) this.me.readyState = state;
				this._initPage();
			} else if (event === "notifyGameReady") {
				//3, 2, 1 추후 구현
			} else if (event === "notifyGameStart") {
				content.playerInfo.forEach((player) => {
					let targetPlayer = this.clientInfo.gameInfo.teamLeftList.find((leftPlayer) => leftPlayer.clientId === player.clientId);
					if (!targetPlayer)
						targetPlayer = this.clientInfo.gameInfo.teamRightList.find((rightPlayer) => rightPlayer.clientId === player.clientId);
					targetPlayer.ability = player.ability;
					targetPlayer.paddleHeight = player.paddleHeight;
					targetPlayer.paddleWidth = player.paddleWidth;
				})
				this.clientInfo.gameInfo.sizeInfo = content.boardInfo;
				this.clientInfo.gameInfo.pingpongRoomSocket.removeEventListener(
					'message',
					listener
				);
				this._onStartPingpongGame();
			} else if (event === "notifySelectAbility") {
				if (content.team === 'left') {
					this.clientInfo.gameInfo.teamLeftAbility = content.ability;
				} else {
					this.clientInfo.gameInfo.teamRightAbility = content.ability;
				}
				if (content.team === this.me.team && this.myAbilityButton) {
					this.me.selectAbility = true;
				}
				this._initPage();
			}
		};
		this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener(
			"message",
			listener
		);
	}

	_pushNewPlayer(clientId, clientNickname, team) {
		if (this.clientInfo.id === clientId) return;
		if (team === "left")
			this.clientInfo.gameInfo.teamLeftList.push({
				clientId,
				clientNickname,
				readyState: "NOTREADY",
			});
		if (team === "right")
			this.clientInfo.gameInfo.teamRightList.push({
				clientId,
				clientNickname,
				readyState: "NOTREADY",
			});
	}

	_popPlayer(clientId) {
		this.clientInfo.gameInfo.teamLeftList =
			this.clientInfo.gameInfo.teamLeftList.filter((player) => {
				player.clientId !== clientId;
			});
		this.clientInfo.gameInfo.teamRightList =
			this.clientInfo.gameInfo.teamRightList.filter((player) => {
				player.clientId !== clientId;
			});
	}

	_updateReadyState(clientId, readyState) {
		this.clientInfo.gameInfo.teamLeftList.forEach((player) => {
			if (player.clientId === clientId) player.readyState = readyState;
		});
		this.clientInfo.gameInfo.teamRightList.forEach((player) => {
			if (player.clientId === clientId) player.readyState = readyState;
		});
	}

	_sendMyReadyStateChangeMessage() {
		let myPlayer = this.clientInfo.gameInfo.teamLeftList.find(
			(player) => player.clientId === this.clientInfo.id
		);
		if (!myPlayer)
			myPlayer = this.clientInfo.gameInfo.teamRightList.find(
				(player) => player.clientId === this.clientInfo.id
			);

		const changedReadyState =
			myPlayer.readyState === "READY" ? "NOTREADY" : "READY";
		const readyMessage = {
			event: "changeReadyState",
			content: {
				state: changedReadyState,
			},
		};
		this.clientInfo.gameInfo.pingpongRoomSocket.send(
			JSON.stringify(readyMessage)
		);
	}

	_changeMyReadyState(clientId) {
		let targetPlayer = this.clientInfo.gameInfo.teamLeftList.find(
			(player) => player.clientId === clientId
		);
		if (!targetPlayer)
			targetPlayer = this.clientInfo.gameInfo.teamRightList.find(
				(player) => player.clientId === clientId
			);
		targetPlayer.readyState === "READY"
			? (targetPlayer.readyState = "NOTREADY")
			: (targetPlayer.readyState = "READY");
	}

	_subscribeWindow() {
		this.toggleReadyTextVisibleRef = this._toggleReadyTextVisible.bind(this);
		windowObservable.subscribeOrientationChange(this.toggleReadyTextVisibleRef);
	}

	_toggleReadyTextVisible(orientation) {
		if (orientation === "landscape") {
			this.leftReadyText.classList.remove("invisible");
			this.rightReadyText.classList.remove("invisible");
		} else if (orientation === "portrait") {
			this.leftReadyText.classList.add("invisible");
			this.rightReadyText.classList.add("invisible");
		}
	}

	_displayAbilityModal() {
		this.abilityModal.style.display = 'flex';
		this.abilityModal.addEventListener('click', this._modalClicked);
	}
	_modalClicked = (event) => {
		const selectedItem = event.target.closest('.abilityItem');
		if (selectedItem === null)
			return;
		const selectAbilityMessage = {
			event: "selectAbility",
			content: { ability: selectedItem.value }
		}
		this.clientInfo.gameInfo.pingpongRoomSocket.send(JSON.stringify(selectAbilityMessage));
		this.abilityModal.style.display = 'none';
		this.abilityModal.removeEventListener('click', this._modalClicked);
	}

	_manageExitRoom() {
		const exitButton = document.querySelector('.exitButton');
		const exitYesButton = document.querySelector(
			'.questionModal .activatedButton:nth-of-type(1)');
		const exitNoButton = document.querySelector(
			'.questionModal .activatedButton:nth-of-type(2)');
		const questionModal = document.querySelector('.questionModal');

		exitButton.addEventListener('click', () => {
			questionModal.style.display = 'flex';
		});
		exitYesButton.addEventListener('click', () => {
			this._exitWaitingRoom();
		});
		exitNoButton.addEventListener('click', () => {
			questionModal.style.display = 'none';
		})
	}
	async _exitWaitingRoom() {
		this.clientInfo.gameInfo.pingpongRoomSocket.close();
		this.clientInfo.gameInfo = null;
		this.clientInfo.lobbySocket = await this._connectLobbySocket(
			this.clientInfo.id
		);
		this._onExitWaitingRoom();
	}

	_getHTML() {
		let readyButtonStyle = '';
		if (this.me.readyState === 'READY') {
			readyButtonStyle = 'activatedButton';
		} else if (this.me.mode === 'human') {
			readyButtonStyle = 'generalButton';
		} else if (this.me.mode === 'vampire' && this.me.selectAbility) {
			readyButtonStyle = 'generalButton';
		} else {
			readyButtonStyle = 'disabledButton';
		}
		let abilityModalHTML = '';
		if (this.clientInfo.gameInfo.teamLeftMode === 'vampire' && this.clientInfo.gameInfo.teamRightMode === 'vampire') {
			abilityModalHTML = `${this._getVamVamAbilityModalHTML()}`;
		} else {
			abilityModalHTML = `${this._getVamHuAbilityModalHTML()}`;
		}

		return `
			<div id="container">
				<div id="header">
					<div id="title">${this.clientInfo.gameInfo.title}</div>
					<div id="mode">${this._getMode()}</div>
				</div>
				<div id="panel">
					${this._getTeamPanelHTML(
						this.clientInfo.gameInfo.teamLeftMode,
						this.clientInfo.gameInfo.teamLeftList,
						this.clientInfo.gameInfo.teamLeftTotalPlayerCount,
						this.clientInfo.gameInfo.teamLeftAbility
					)}
					<div id="vsText">VS</div>
					${this._getTeamPanelHTML(
						this.clientInfo.gameInfo.teamRightMode,
						this.clientInfo.gameInfo.teamRightList,
						this.clientInfo.gameInfo.teamRightTotalPlayerCount,
						this.clientInfo.gameInfo.teamRightAbility
					)}
				</div>
				<button class="${readyButtonStyle}" id="readyButton" ${readyButtonStyle === 'disabledButton' ? 'disabled' : ''}>
					Ready
				</button>
			</div>
			${abilityModalHTML}
			${this._getQuestionModalHTML()}
		`;
	}
	_getMode() {
		const left =
			this.clientInfo.gameInfo.teamLeftMode === "vampire" ? "뱀파이어" : "인간";
		const right = 
			this.clientInfo.gameInfo.teamRightMode === "vampire" ? "뱀파이어" : "인간";
		return `${left} VS ${right} 모드`;
	}

	_getTeamPanelHTML(mode, teamList, totalPlayerCount, selectAbility) {
		let infoHTML;
		if (totalPlayerCount === 1) {
			if (teamList.length === 0) infoHTML = this._getPlayerEmptyInfoHTML(mode);
			else infoHTML = this._getPlayerInfoHTML(mode, teamList[0], selectAbility);
		} else {
			infoHTML = this._getPlayerInfoListHTML(teamList, totalPlayerCount);
		}
		const readyAll = teamList.length === totalPlayerCount && teamList.every((player) => player.readyState === 'READY');
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

	_getPlayerEmptyInfoHTML(mode) {
		const abilityBtnHTML =
			'<button class="abilityButton generalButton">?</button>';
		return `
			<div class="nameContainer">
				<div class="name">?</div>
			</div>
			<div class="avatar">
				${mode === 'vampire' ? abilityBtnHTML : ''}
				<div class="avatarImgFrame emptyFrame">
					<div class="avatarQuestionMark">?</div>
				</div>
			</div>
		`;
	}

	_getPlayerInfoHTML(mode, player, selectAbility) {
		let abilityBtnInnerHTML;
		const isMine = player.clientId === this.clientInfo.id;
		if (selectAbility) {
			abilityBtnInnerHTML = `
				<div class="abilityImgFrame">
					<img class="abilityImg" src="images/ability/${selectAbility}.png">
				</div>`;
		} else {
			abilityBtnInnerHTML = `${isMine ? '능력<br>선택' : '?'}`;
		}
		let abilityBtnHTML = `
			<button class="abilityButton generalButton ${isMine ? 'myAbilityButton' : ''}">
				${abilityBtnInnerHTML}
			</button>
		`;

		return `
			<div class="nameContainer">
				<div class="name">${player.clientNickname}</div>
			</div>
			<div class="avatar">
				${mode === 'vampire' ? abilityBtnHTML : ''}
				<div class="avatarImgFrame">
					<img class="avatarImg ${player.readyState === 'READY' ? 'on' : ''}" 
						src="images/playerA.png">
				</div>
			</div>
		`;
	}

	_getPlayerInfoListHTML(playerList, totalPlayerCount) {
		let listHTML = "";
		playerList.forEach((player) => {
			listHTML += `
				<div class="listItem ${player.clientId === this.clientInfo.id ? "me" : ""}">
					${this._getPlayerInfoItemHTML(player)}
				</div>`;
		});
		for (let i = 0; i < totalPlayerCount - playerList.length; i++) {
			listHTML += `<div class="listItem">${this._getEmptyItemHTML()}</div>`;
		}
		for (let i = 0; i < 5 - totalPlayerCount; i++) {
			listHTML += `<div class="listItem">${this._getXItemHTML()}</div>`;
		}
		return listHTML;
	}
	_getPlayerInfoItemHTML(player) {
		return `
			<div class="avatarImgFrame">
				<img class="avatarImg ${player.readyState === "READY" ? "on" : ""
			}" src="images/playerA.png">
			</div>
			<div class="listName">${player.clientNickname}</div>
		`;
	}
	_getEmptyItemHTML() {
		return `
			<div class="avatarImgFrame emptyFrame">
				<div class="avatarQuestionMark">?</div>
			</div>
			<div class="listName">?</div>
		`;
	}
	_getXItemHTML() {
		return `
			<div class="avatarImgFrame">
				<div class="diagonal-1"></div>
				<div class="diagonal-2"></div>
			</div>
		`;
	}

	_getVamVamAbilityModalHTML() {
		return `
			<div class="abilitySelectionModal">
				<div class="abilityContainer" id="vamVamAbilityContainer">
					<div class="abilitySubContainer">
						${this._getAbilityItemHTML(
							'스피드 트위스터',
							'speedTwister',
							'패들로 공을 쳤을 때, 공의 속도와 이동 방향이 왜곡된다.'
						)}
					</div>
					<div class="abilitySubContainer">
						${this._getAbilityItemHTML(
							'고스트 스매셔',
							'ghostSmasher',
							'패들로 공을 쳤을 때, 공이 잠시 투명해진다.'
						)}
					</div>
				</div>
			</div>
		`;
	}
	_getVamHuAbilityModalHTML() {
		return `
			<div class="abilitySelectionModal">
				<div class="abilityContainer">
					<div class="abilitySubContainer">
						${this._getAbilityItemHTML(
							'자이언트 블로커',
							'jiantBlocker',
							'뱀파이어 패들의 크기는 커지고, 인간 패들의 크기는 작아진다.'
						)}
						${this._getAbilityItemHTML(
							'스피드 트위스터',
							'speedTwister',
							'패들로 공을 쳤을 때, 공의 속도와 이동 방향이 왜곡된다.'
						)}
					</div>
					<div class="abilitySubContainer">
						${this._getAbilityItemHTML(
							'일루젼 페이커',
							'illusionFaker',
							'패들로 공을 쳤을 때, 인간 팀이 판별할 수 없는 가짜 공이 생성된다.'
						)}
						${this._getAbilityItemHTML(
							'고스트 스매셔',
							'ghostSmasher',
							'패들로 공을 쳤을 때, 공이 잠시 투명해진다.'
						)}
					</div>
				</div>
			</div>
		`;
	}
	_getAbilityItemHTML(koName, enName, description) {
		return `
			<button class="abilityItem" value="${enName}">
				<div class="abilityName">${koName}</div>
				<div class="abilityImgFrame">
					<img class="abilityImg" src="images/ability/${enName}.png">
				</div>
				<div class="abilityDescription">${description}</div>
			</button>
		`;
	}

	_getQuestionModalHTML() {
		return `
			<button class="exitButton"></button>
			<div class="questionModal">
				<div class="questionBox">
					<div class="question">대결에 참전하지 않으시겠습니까?</div>
					<div class="buttonGroup">
						<button class="activatedButton">네</button>
						<button class="activatedButton">아니오</button>
					</div>
				</div>
			</div>
		`;
	}
}

export default WaitingRoomPageManager;
