import windowObservable from "../../WindowObservable.js";

import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";
import { _connectLobbySocket } from "../connect.js";

class TournamentPageManager {
	constructor(app, clientInfo, _onStartPingpongGame, _joinLobbyPage) {
		this.app = app;
		this._onStartPingpongGame = _onStartPingpongGame;
		this._joinLobbyPage = _joinLobbyPage;
		this.clientInfo = clientInfo;
		this.clientInfo.id = "1"; // TODO : 임시 하드코딩

		this.playerList = [ // TODO : 토너먼트 입장 시 받은 정보로 갈아끼우기
			{
				clientId: "1",
				clientNickname: "김뱀파이어어어어어어어어엉어어어어어",
				avartarUrl: "images/playerA.png"
			},
			{
				clientId: "2",
				clientNickname: "김뱀파이어",
				avartarUrl: "images/playerA.png"
			},
			{
				clientId: "3",
				clientNickname: "김뱀파",
				avartarUrl: "images/playerA.png"
			},
			{
				clientId: "4",
				clientNickname: "김뱀",
				avartarUrl: "images/playerA.png"
			}
		];

		this.tournamentInfo = {
			semiFinal: [
				{
					clientIdList: ["1", "2"],
					score: [0, 10],
					roomId: "123456",
					state: "finished"
				},
				{
					clientIdList: ["3", "4"],
					score: [10, 0],
					roomId: "1234",
					state: "isPlaying"
				}
			],
			final: [
				{
					clientIdList: ["1", "3"],
					score: [0, 10],
					roomId: "123456",
					state: "notStared"
				}
			]
		};

		// this._getTournamentInfo();
		this._initPage();
	}

	_initPage() {
		this.app.innerHTML = this._getHTML();
		requestAnimationFrame(this._renderBracket.bind(this)); // TODO : 가끔 안 먹을 때 있음!ㅠㅠ
		this._subscribeWindow();
		// this._listenTournamentEvent(); TODO : 현재 테스트 불가능함
		this._setTournamentExitButton();
	}

	async _getTournamentInfo() {
		const getTournamentInfoMessage = {
			event: "getTournamentGameInfo",
			content: {}
		}
		this.clientInfo.tournamentInfo.tournamentSocket.send(JSON.stringify(getTournamentInfoMessage));
		const { semiFinal, final } = await new Promise(resolve => {
			const listener = (messageEvent) => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === 'getTournamentGameInfoResponse') {
					this.clientInfo.tournamentInfo.tournamentSocket.removeEventListener('message', listener);
					resolve(content);
				}
			}
			this.clientInfo.tournamentInfo.tournamentSocket.addEventListener('message', listener);
		});
		this.tournamentInfo.semiFinal = semiFinal;
		this.tournamentInfo.final = final;
		this._initPage();
	}

	_subscribeWindow() {
		this._renderBracketRef = this._renderBracket.bind(this);
		windowObservable.subscribeResize(this._renderBracketRef);
	}
	_unsubscribeWindow() { // TODO : 페이지 나갈 시 호출
		windowObservable.unsubscribeResize(this._renderBracketRef);
	}

	_listenTournamentEvent() {
		const listener = async (messageEvent) => {
			const message = JSON.parse(messageEvent);
			const { event, content } = message;
			if (event === "notifyYourGameRoomReady") {
				await this._enterWaitingRoom(content.tournamentID); // TODO : tournamentID가 roomId 맞나?
				this._enterPingpongRoom();
			}
		}
		this.clientInfo.tournamentInfo.tournamentSocket.addEventListener('message', listener);
	}

	async _enterWaitingRoom(roomId) {
		// 핑퐁룸 소켓에 연결
		const pingpongRoomSocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/pingpong-room/${roomId}/`);
		await new Promise(resolve => {
			pingpongRoomSocket.addEventListener("open", () => {
				resolve();
			});
		});
		// 대기실 입장 요청 보내기
		const enterWaitingRoomMessage = {
			event: "enterWaitingRoom",
			content: { clientId: this.clientInfo.id }
		};
		pingpongRoomSocket.send(JSON.stringify(enterWaitingRoomMessage));
		// 대기실 입장 응답 받기
		await new Promise(resolve => {
			const listener = (messageEvent) => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "enterWaitingRoomResponse") {
					pingpongRoomSocket.removeEventListener("message", listener);
					resolve();
				}
			}
			pingpongRoomSocket.addEventListener("message", listener);
		});
		this.clientInfo.gameInfo = {
			pingpongRoomSocket,
			roomId,
			title: null,
			teamLeftList: [], teamRightList: [],
			teamLeftMode: 'human', teamRightMode: 'human',
			teamLeftTotalPlayerCount: 1, teamRightTotalPlayerCount: 1,
			teamLeftAbility: null, teamRightAbility: null
		}
		this.clientInfo.lobbySocket.close();
		this.clientInfo.lobbySocket = null;
	}

	async _enterPingpongRoom() {
		// 바로 준비 완료 메시지 보내기
		const changeReadyStateMessage = {
			event: "changeReadyState",
			content: { readyState: "READY" }
		}
		this.clientInfo.gameInfo.pingpongRoomSocket.send(JSON.stringify(changeReadyStateMessage));
		// 3초 후 notifyGameStart 메시지 받기
		const { boardInfo, playerInfo } = await new Promise(resolve => {
			const listener = (messageEvent) => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === 'notifyGameStart') {
					this.clientInfo.gameInfo.pingpongRoomSocket.removeEventListener('message', listener);
					resolve(content);
				}
			}
			this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener('message', listener);
		});
		// teamLeftList, teamRightList 세팅 후 핑퐁룸 입장
		playerInfo.forEach((player) => {
			let teamList;
			if (player.team === 'left') {
				teamList = this.clientInfo.gameInfo.teamLeftList;
			} else if (player.team === 'right') {
				teamList = this.clientInfo.gameInfo.teamRightList;
			}
			teamList.push({
				clinetId: player.clientId,
				clientNickname: this.playerList.find((p) => p.clientId === player.clientId).clientNickname,
				readyState: 'READY',
				ability: null,
				paddleWidth: player.paddleWidth,
				paddleHeight: player.paddleHeight,
			});
		});
		this.clientInfo.gameInfo.sizeInfo = boardInfo;
		this._unsubscribeWindow();
		this._onStartPingpongGame();
	}

	_setTournamentExitButton() {
		document.querySelector('#tournamentExitButton').addEventListener('click', async () => {
			// this.clientInfo.tournamentInfo.tournamentSocket.close(); TODO : 이후에 주석 풀기
			// this.clientInfo.lobbySocket = await this._connectLobbySocket(); TODO : 현재 테스트 불가
			this.clientInfo.tournamentInfo = null;
			this.clientInfo.lobbySocket = await _connectLobbySocket(this.clientInfo.id);
			this._joinLobbyPage();
		})
	}
	async _connectLobbySocket() {
		const lobbySocket = new WebSocket(
			`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby/`
		);
		await new Promise(resolve => {
			lobbySocket.addEventListener('open', () => {
				resolve();
			});
		});
		const enterLobbyMessage = {
			event: "enterLobby",
			content: { cliendId: this.clientInfo.id }
		}
		lobbySocket.send(JSON.stringify(enterLobbyMessage));
		
		await new Promise(resolve => {
			const listener = (messageEvent) => {
				const { event, content } = JSON.parse(messageEvent.data);
				console.log(JSON.parse(messageEvent.data));
				if (event === "enterLobbyResponse" && content.message === "OK") {
					lobbySocket.removeEventListener('message', listener);
					resolve();
				}
			}
			lobbySocket.addEventListener('message', listener);
		});
		return lobbySocket;
	}

	_renderBracket() {
		const elementCanvas = document.querySelector('#elementCanvas');
		elementCanvas.innerHTML = '';
		const lineCanvas = document.querySelector('#lineCanvas');
		lineCanvas.innerHTML = '';

		let pointBelowWinner;
		let pointBelowFinal1;
		let pointBelowFinal2;

		const getTopCenterPos = (rect) => {
			return { x: rect.left + (rect.width / 2), y: rect.top };
		}
		const getBottomCenterPos = (rect) => {
			return { x: rect.left + (rect.width / 2), y: rect.bottom };
		}
		const renderLines = () => {
			function createLine(pos1, pos2) {
				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', pos1.x);
				line.setAttribute('y1', pos1.y);
				line.setAttribute('x2', pos2.x);
				line.setAttribute('y2', pos2.y);
				line.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
				line.setAttribute('stroke-width', '0.1rem');
				lineCanvas.append(line);
			}
			const winner = document.querySelector('#root').getBoundingClientRect();
			const final1 = document.querySelector('.subTree:first-of-type .final').getBoundingClientRect();
			const final2 = document.querySelector('.subTree:last-of-type .final').getBoundingClientRect();

			const final1TopCenter = getTopCenterPos(final1);
			const final2TopCenter = getTopCenterPos(final2);
			const winnerBottomCenter = getBottomCenterPos(winner);

			const pointAboveFinal1 = { x: final1TopCenter.x, y: (final1TopCenter.y + winnerBottomCenter.y) / 2 };
			const pointAboveFinal2 = { x: final2TopCenter.x, y: (final2TopCenter.y + winnerBottomCenter.y) / 2 };
			pointBelowWinner = { x: winnerBottomCenter.x, y: pointAboveFinal1.y };

			createLine(final1TopCenter, pointAboveFinal1);
			createLine(final2TopCenter, pointAboveFinal2);
			createLine(pointAboveFinal1, pointBelowWinner);
			createLine(pointAboveFinal2, pointBelowWinner);
			createLine(winnerBottomCenter, pointBelowWinner);

			const semiFinal1 = document.querySelector('.subTree:first-of-type .semiFinal .player:first-of-type').getBoundingClientRect();
			const semiFinal2 = document.querySelector('.subTree:first-of-type .semiFinal .player:last-of-type').getBoundingClientRect();
			const semiFinal3 = document.querySelector('.subTree:last-of-type .semiFinal .player:first-of-type').getBoundingClientRect();
			const semiFinal4 = document.querySelector('.subTree:last-of-type .semiFinal .player:last-of-type').getBoundingClientRect();

			const semiFinal1TopCenter = getTopCenterPos(semiFinal1);
			const semiFinal2TopCenter = getTopCenterPos(semiFinal2);
			const semiFinal3TopCenter = getTopCenterPos(semiFinal3);
			const semiFinal4TopCenter = getTopCenterPos(semiFinal4);
			const final1BottomCenter = getBottomCenterPos(final1);
			const final2BottomCenter = getBottomCenterPos(final2);

			const pointAboveSemiFinal1 = { x: semiFinal1TopCenter.x, y: (semiFinal1TopCenter.y + final1BottomCenter.y) / 2 };
			const pointAboveSemiFinal2 = { x: semiFinal2TopCenter.x, y: (semiFinal2TopCenter.y + final1BottomCenter.y) / 2 };
			const pointAboveSemiFinal3 = { x: semiFinal3TopCenter.x, y: (semiFinal3TopCenter.y + final2BottomCenter.y) / 2 };
			const pointAboveSemiFinal4 = { x: semiFinal4TopCenter.x, y: (semiFinal4TopCenter.y + final2BottomCenter.y) / 2 };

			pointBelowFinal1 = { x: final1BottomCenter.x, y: pointAboveSemiFinal1.y };
			pointBelowFinal2 = { x: final2BottomCenter.x, y: pointAboveSemiFinal3.y };

			createLine(semiFinal1TopCenter, pointAboveSemiFinal1);
			createLine(semiFinal2TopCenter, pointAboveSemiFinal2);
			createLine(semiFinal3TopCenter, pointAboveSemiFinal3);
			createLine(semiFinal4TopCenter, pointAboveSemiFinal4);

			createLine(pointAboveSemiFinal1, pointBelowFinal1);
			createLine(pointAboveSemiFinal2, pointBelowFinal1);
			createLine(pointAboveSemiFinal3, pointBelowFinal2);
			createLine(pointAboveSemiFinal4, pointBelowFinal2);

			createLine(final1BottomCenter, pointBelowFinal1);
			createLine(final2BottomCenter, pointBelowFinal2);
		}
		const renderElements = () => {
			function setElementPos(type, element) {
				if (type === 'final') {
					element.style.top = `${pointBelowWinner.y * 1.04}px`;
					element.style.left = `${pointBelowWinner.x}px`;
				} else if (type === 'leftSemiFinal') {
					element.style.top = `${pointBelowFinal1.y * 1.02}px`;
					element.style.left = `${pointBelowFinal1.x}px`;
				} else if (type === 'rightSemiFinal') {
					element.style.top = `${pointBelowFinal2.y * 1.02}px`;
					element.style.left = `${pointBelowFinal2.x}px`;
				}
			}
			function createObserveButton(type) {
				const observeButton = document.createElement('button');
				observeButton.classList.add('generalButton', 'observeButton');
				observeButton.textContent = '관전하기';
				setElementPos(type, observeButton);
				elementCanvas.append(observeButton);
			}
			function createScoreBox(type, leftScore, rightScore) {
				const scoreBox = document.createElement('div');
				scoreBox.classList.add('scoreBox');
				scoreBox.innerHTML = `
					<div class="score">${leftScore}</div>
					<div class="score">${rightScore}</div>
				`;
				setElementPos(type, scoreBox);
				elementCanvas.append(scoreBox);
			}
			const stages = [...this.tournamentInfo.final, ...this.tournamentInfo.semiFinal];
			const types = ['final', 'leftSemiFinal', 'rightSemiFinal'];
			stages.forEach((stage, index) => {
				if (stage.state === 'isPlaying') {
					createObserveButton(types[index]);
				} else if (stage.state == 'finished') {
					createScoreBox(types[index], ...stage.score);
				}
			});
		}

		renderLines();
		renderElements();
	}

	// TODO : playerList의 clientId와 final의 clientIdList 타입을 맞춰야 할 듯
	_getHTML() {
		let winner = null;
		const [final] = this.tournamentInfo.final;
		if (final.state === 'finished') {
			winner = this._getWinningPlayer(final.score, final.clientIdList);
		}
		const exitable = this._getExitable();
		return `
			<button id="tournamentExitButton" class="generalButton ${!exitable ? 'invisible' : ''}" ${!exitable ? 'disabled' : ''}>
				<img src="images/exitImg.png">토너먼트에서 나가기
			</button>
			<div id="container">
				${this._getRootHTML(winner)}
				${this._getSubTreesHTML()}
			</div>
			<svg id="lineCanvas"></svg>
			<div id="elementCanvas"></div>
		`;
	}

	_getExitable() {
		// 종료된 준결승 경기에서 내가 졌다면 나가기 가능
		const isSemiFinalExitable = (semiFinal) => {
			if (semiFinal.state === 'finished' && semiFinal.clientIdList.includes(this.clientInfo.id)) {
				const winningPlayer = this._getWinningPlayer(semiFinal.score, semiFinal.clientIdList);
				return winningPlayer.clientId !== this.clientInfo.id;
			}
			return false;
		};
		if (this.tournamentInfo.semiFinal.some(isSemiFinalExitable))
			return true;
		// 결승까지 종료됐다면 나가기 가능
		if (this.tournamentInfo.final[0].state === 'finished') {
			return true;
		}
		return false;
	}

	_getRootHTML(finalist) {
		return `
			<div id="root">
				${finalist ? this._getPlayerHTML(finalist, true) : this._getEmptyPlayerHTML(true)}
			</div>
		`;
	}
	_getSubTreesHTML() {
		let leftFinalist = null;
		let rightFinalist = null;
		const [leftSemiFinal, rightSemiFinal] = this.tournamentInfo.semiFinal;
		if (leftSemiFinal.state === 'finished') {
			leftFinalist = this._getWinningPlayer(leftSemiFinal.score, leftSemiFinal.clientIdList);
		}
		if (rightSemiFinal.state === 'finished') {
			rightFinalist = this._getWinningPlayer(rightSemiFinal.score, rightSemiFinal.clientIdList);
		}
		return `
			<div id="subTrees">
				${this._getSubTreeHTML(leftFinalist, this.playerList.slice(0, 2))}
				${this._getSubTreeHTML(rightFinalist, this.playerList.slice(2))}
			</div>
		`;
	}
	_getSubTreeHTML(finalist, semiFinalist) {
		return `
			<div class="subTree">
				<div class="final">
					${finalist ? this._getPlayerHTML(finalist) : this._getEmptyPlayerHTML()}
				</div>
				<div class="semiFinal">
					${this._getPlayerHTML(semiFinalist[0])}
					${this._getPlayerHTML(semiFinalist[1])}
				</div>
			</div>
		`;
	}
	_getEmptyPlayerHTML(isWinner = false) {
		return `
			<div class="player emptyPlayer">
				<div class="avatar">
					<div class="avatarImgFrame">?</div>
					${isWinner ? '<img class="crownImg" src="images/tournamentCrown.png">' : ''}
				</div>
				<div class="nickname">
					<div class="nicknameText">???</div>
				</div>
			</div>
		`;
	}
	_getPlayerHTML(player, isWinner = false) {
		return `
			<div class="player">
				<div class="avatar">
					<div class="avatarImgFrame">
						<img class="avatarImg" src="${player.avartarUrl}">
					</div>
					${isWinner ? '<img class="crownImg" src="images/tournamentCrown.png">' : ''}
				</div>
				<div class="nickname">
					<div class="nicknameText">${player.clientNickname}</div>
				</div>
			</div>
		`;
	}

	_getWinningPlayer(score, clientIdList) {
		const [score1, score2] = score;
		const [clientId1, clientId2] = clientIdList;
		const winnerId = score1 > score2 ? clientId1 : clientId2;
		return this.playerList.find(player => player.clientId === winnerId);
	}
}

export default TournamentPageManager;