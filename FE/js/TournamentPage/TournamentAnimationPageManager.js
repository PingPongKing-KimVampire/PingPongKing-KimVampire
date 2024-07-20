import windowObservable from "../../WindowObservable.js";

import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class TournamentAnimationPageManager {
	constructor(app, clientInfo, _onStartPingpongGame) {
		this.app = app;
		this._onStartPingpongGame = _onStartPingpongGame;
		this.clientInfo = clientInfo;

		//tournamentSocket의 리스너는 토너먼트 시작과 나가기때만 등록, 해제한다?

		// this.clientInfo.tournamentInfo.tournamentSocket
		// this.clientInfo.tournamentInfo.tournamentClientList

		// this.clientInfo = {
		// 	tournamentInfo: {
		// 		tournamentClientList: {},
		// 	},
		// };

		// this.clientInfo.tournamentInfo.tournamentClientList = [
		// 	// TODO : 토너먼트 입장 시 받은 정보로 갈아끼우기
		// 	{
		// 		id: "1",
		// 		nickname: "김뱀파이어어어어어어어어엉어어어어어",
		// 		avatarUrl: "images/playerA.png",
		// 	},
		// 	{
		// 		id: "2",
		// 		nickname: "김뱀파이어",
		// 		avatarUrl: "images/playerB.png",
		// 	},
		// 	{
		// 		id: "3",
		// 		nickname: "김뱀파",
		// 		avatarUrl: "images/playerC.svg",
		// 	},
		// 	{
		// 		id: "4",
		// 		nickname: "김뱀",
		// 		avatarUrl: "images/noFriendVampire3.webp",
		// 	},
		// ];

		// this.tournamentInfo = {
		// 	semiFinal: [
		// 		{
		// 			clientIdList: ["1", "2"],
		// 			score: [0, 10],
		// 			roomId: "123456",
		// 			state: "finished", //notStarted|isPlaying|finished
		// 		},
		// 		{
		// 			clientIdList: ["3", "4"],
		// 			score: [10, 0],
		// 			roomId: "1234",
		// 			state: "isPlaying",
		// 		},
		// 	],
		// 	final: [
		// 		{
		// 			clientIdList: ["2", "3"],
		// 			score: [10, 0],
		// 			roomId: "123456",
		// 			state: "finished",
		// 		},
		// 	],
		// };

		// 정보 업데이트
		// setTimeout(this._initAnimation.bind(this, "final"), 1000);
		this._initPage();
	}
	
	async _initPage() {
		this._listenTournamentEvent();
		await this._getTournamentInfo();
		this.app.innerHTML = this._getHTML();
		this._subscribeWindow();

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.point = this._calculatePoints();
				this._renderCurrentTournamentInfo();
			});
		});
	}

	async _initAnimation(stage) {
		this._listenTournamentEvent();
		stage = "final"; //하드코딩
		await this._getTournamentInfo();
		this.app.innerHTML = this._getHTML();
		this._subscribeWindow();

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.point = this._calculatePoints();
				this._renderBracketLine();
				this._renderAnimtation(stage);
			});
		});
	}

	async _renderAnimtation(stage) {
		if (stage === "semiFinal") {
			await this._renderPolylineAnimation("leftSemiFinal");
			this._renderPlayer("leftSemiFinal");
			this._renderScoreBox("leftSemiFinal");
			await this._renderPolylineAnimation("rightSemiFinal");
			this._renderPlayer("rightSemiFinal");
			this._renderScoreBox("rightSemiFinal");
		} else if (stage === "final") {
			//하얀 선만 렌더링
			const animationPromise1 = this._renderPolylineAnimation("leftSemiFinal");
			const animationPromise2 = this._renderPolylineAnimation("rightSemiFinal");
			await Promise.all([animationPromise1, animationPromise2]);
			this._renderScoreBox("leftSemiFinal");
			this._renderScoreBox("rightSemiFinal");
			this._renderPlayer("leftSemiFinal");
			this._renderPlayer("rightSemiFinal");
			await this._renderPolylineAnimation("final");
			this._renderPlayer("final");
			this._renderScoreBox("final");
			//나가기?
		}
	}

	_renderPlayer(type) {
		if (type === "leftSemiFinal") {
			const [leftSemiFinal, rightSemiFinal] = this.tournamentInfo.semiFinal;
			const leftFinalContainer = document.querySelector(".subTree:first-of-type .final");
			leftFinalContainer.innerHTML = this._getPlayerHTML(this._getWinningPlayer(leftSemiFinal.score, leftSemiFinal.clientIdList));
		} else if (type === "rightSemiFinal") {
			const [leftSemiFinal, rightSemiFinal] = this.tournamentInfo.semiFinal;
			const rightFinalContainer = document.querySelector(".subTree:last-of-type .final");
			rightFinalContainer.innerHTML = this._getPlayerHTML(this._getWinningPlayer(rightSemiFinal.score, rightSemiFinal.clientIdList));
		} else if (type === "final") {
			const [final] = this.tournamentInfo.final;
			const winnerContainer = document.querySelector("#root");
			winnerContainer.innerHTML = this._getPlayerHTML(this._getWinningPlayer(final.score, final.clientIdList), true); //승자 판단해서 렌더링 해야함
		}
	}

	_renderScoreBox(type) {
		const createScoreBox = (leftScore, rightScore) => {
			const scoreBox = document.createElement("div");
			scoreBox.classList.add("scoreBox");
			scoreBox.innerHTML = `
				<div class="score">${leftScore}</div>
				<div class="score">${rightScore}</div>
			`;
			this._setElementPos(type, scoreBox);
			return scoreBox;
		};
		if (type === "leftSemiFinal") {
			const leftScore = this.tournamentInfo.semiFinal[0].score[0];
			const rightScore = this.tournamentInfo.semiFinal[0].score[1];
			const scoreBox = createScoreBox(leftScore, rightScore);
			elementCanvas.append(scoreBox);
		} else if (type === "rightSemiFinal") {
			const leftScore = this.tournamentInfo.semiFinal[1].score[0];
			const rightScore = this.tournamentInfo.semiFinal[1].score[1];
			const scoreBox = createScoreBox(leftScore, rightScore);
			elementCanvas.append(scoreBox);
		} else if (type === "final") {
			const leftScore = this.tournamentInfo.final[0].score[0];
			const rightScore = this.tournamentInfo.final[0].score[1];
			const scoreBox = createScoreBox(leftScore, rightScore);
			elementCanvas.append(scoreBox);
		}
	}

	_setElementPos(type, element) {
		if (type === "final") {
			element.style.top = `${this.point.pointBelowWinner.y * 1.04}px`;
			element.style.left = `${this.point.pointBelowWinner.x}px`;
		} else if (type === "leftSemiFinal") {
			element.style.top = `${this.point.pointBelowFinal1.y * 1.02}px`;
			element.style.left = `${this.point.pointBelowFinal1.x}px`;
		} else if (type === "rightSemiFinal") {
			element.style.top = `${this.point.pointBelowFinal2.y * 1.02}px`;
			element.style.left = `${this.point.pointBelowFinal2.x}px`;
		}
	}

	_addPolylineInCanvas(){
		const lineCanvas = document.querySelector("#lineCanvas");
		const svgNS = "http://www.w3.org/2000/svg";
		const polyline = document.createElementNS(svgNS, "polyline");
		polyline.classList.add("whitePolyline");
		lineCanvas.append(polyline);
		return polyline;
	}

	_getPointListForPolyline(type){
		let firstLine;
		let secondLine;
		let thirdLine;
		if (type === "leftSemiFinal") {
			if (this.tournamentInfo.semiFinal[0].score[0] > this.tournamentInfo.semiFinal[0].score[1]) {
				firstLine = document.querySelector("#leftSemiFinalLeftTeamTopToTop");
				secondLine = document.querySelector("#leftSemiFinalLeftTeamAboveToRight");
				thirdLine = document.querySelector("#leftSemiFinalAboveToTop");
			} else {
				firstLine = document.querySelector("#leftSemiFinalRightTeamTopToTop");
				secondLine = document.querySelector("#leftSemiFinalRightTeamAboveToLeft");
				thirdLine = document.querySelector("#leftSemiFinalAboveToTop");
			}
		} else if (type === "rightSemiFinal") {
			if (this.tournamentInfo.semiFinal[1].score[0] > this.tournamentInfo.semiFinal[1].score[1]) {
				firstLine = document.querySelector("#rightSemiFinalLeftTeamTopToTop");
				secondLine = document.querySelector("#rightSemiFinalLeftTeamAboveToRight");
				thirdLine = document.querySelector("#RightSemiFinalAboveToTop");
			} else {
				firstLine = document.querySelector("#rightSemiFinalRightTeamTopToTop");
				secondLine = document.querySelector("#rightSemiFinalRightTeamAboveToLeft");
				thirdLine = document.querySelector("#RightSemiFinalAboveToTop");
			}
		} else if (type === "final") {
			if (this.tournamentInfo.final[0].score[0] > this.tournamentInfo.final[0].score[1]) {
				firstLine = document.querySelector("#finalLeftTeamTopToTop");
				secondLine = document.querySelector("#finalLeftTeamAboveToRight");
				thirdLine = document.querySelector("#finalAboveCenterToTop");
			} else {
				firstLine = document.querySelector("#finalRightTeamTopToTop");
				secondLine = document.querySelector("#finalRightTeamAboveToLeft");
				thirdLine = document.querySelector("#finalAboveCenterToTop");
			}
		}
			const lineElementList = [firstLine, secondLine, thirdLine];

			const pointList = [];
			lineElementList.forEach((lineElement, idx) => {
				const x1 = parseFloat(lineElement.getAttribute("x1"));
				const y1 = parseFloat(lineElement.getAttribute("y1"));
				pointList.push({ x: x1, y: y1 });
				if (idx === lineElementList.length - 1) {
					const x2 = parseFloat(lineElement.getAttribute("x2"));
					const y2 = parseFloat(lineElement.getAttribute("y2"));
					pointList.push({ x: x2, y: y2 });
				}
			});
		return pointList;
	}

	_renderPolylineAnimation(type) {
		return new Promise(resolve => {
			const pointList = this._getPointListForPolyline(type);
			const polyline = this._addPolylineInCanvas();
			const frameRate = 60; //초당 프레임 수
			const duration = 1000; //애니메이션 총 지속시간
			const totalFrames = duration / (1000 / frameRate); //애니메이션 동안 실행될 총 프레임 수
			let currentFrame = 0; //현재 프레임

			function animatePolyline() {
				const progress = currentFrame / totalFrames; //0~1사이의 현재 진행률
				const pointIndex = Math.floor(progress * (pointList.length - 1)); //현재 진행중인 선분의 인덱스 결정
				if (pointIndex === pointList.length - 1) {
					resolve();
					return;
				}

				const startPoint = pointList[pointIndex]; //진행중인 선분의 시작점
				const endPoint = pointList[pointIndex + 1]; //진행중인 선분의 끝점
				const segmentProgress = (progress * (pointList.length - 1)) % 1; //진행중인 선분의 퍼센트

				const currentX = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
				const currentY = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;

				//현재까지 그려진 점들의 좌표
				const currentPoints = pointList
					.slice(0, pointIndex + 1)
					.map(p => `${p.x},${p.y}`)
					.join(" ");
				//현재까지 그려진 점들의 좌표
				const currentLine = `${currentPoints} ${currentX},${currentY}`;
				//현재까지 그려진 점들의 좌표 + 현재좌표를 추가한다.

				polyline.setAttribute("points", currentLine); //point 속성에 등록

				if (currentFrame < totalFrames) {
					currentFrame++;
					requestAnimationFrame(animatePolyline);
				} else {
					resolve();
				}
			}

			animatePolyline();
		});
	}

	async _getTournamentInfo() {
		const getTournamentInfoMessage = {
			event: "getTournamentGameInfo",
			content: {},
		};
		this.clientInfo.tournamentInfo.tournamentSocket.send(JSON.stringify(getTournamentInfoMessage));
		const { semiFinal, final } = await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getTournamentGameInfoResponse") {
					this.clientInfo.tournamentInfo.tournamentSocket.removeEventListener("message", listener);
					resolve(content);
				}
			};
			this.clientInfo.tournamentInfo.tournamentSocket.addEventListener("message", listener);
		});
		this.tournamentInfo = {semiFinal, final};
	}

	_subscribeWindow() {
		// this._renderBracketRef = this._renderBracket.bind(this);
		// windowObservable.subscribeResize(this._renderBracketRef);
	}
	_unsubscribeWindow() {
		// TODO : 페이지 나갈 시 호출
		// windowObservable.unsubscribeResize(this._renderBracketRef);
	}

	_listenTournamentEvent() {
		const listener = async messageEvent => {
			const message = JSON.parse(messageEvent.data);
			const { event, content } = message;
			if (event === "notifyYourGameRoomReady") {
				await this._enterWaitingRoom(content.pingpongroomId);
				this._enterPingpongRoom();
			} else if (event === "notifyAllTeamFinish") {
				this._renderAlertTournament(content.stage);
			}
		};
		this.clientInfo.tournamentInfo.tournamentSocket.addEventListener("message", listener);
	}

	async _renderAlertTournament(stage) {
		async function _renderTournamentWarning() {
			return new Promise(resolve => {
				let count = 1;
				const tournamentWarning = document.createElement("div");
				tournamentWarning.className = "tournamentWarning";
				tournamentWarning.textContent = `${count}초 후 토너먼트로 돌아갑니다`;
				this.app.append(tournamentWarning);
				const intervalId = setInterval(() => {
					count--;
					if (count == -1) {
						clearInterval(intervalId);
						tournamentWarning.remove();
						resolve();
					}
					tournamentWarning.textContent = `${count}초 후 토너먼트로 돌아갑니다`;
				}, 1000);
			});
		}
		await _renderTournamentWarning.call(this);

		//5초 후 토너먼트 화면으로 이동하고 애니메이션을 렌더링함
		if (stage === "semiFinal") {
		} else if (stage === "final") {
		}
	}

	async _enterWaitingRoom(roomId) {
		// 핑퐁룸 소켓에 연결
		const pingpongRoomSocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/pingpong-room/${roomId}`, ['authorization', this.clientInfo.accessToken]);
		await new Promise(resolve => {
			pingpongRoomSocket.addEventListener("open", () => {
				resolve();
			});
		});
		// // 대기실 입장 요청 보내기
		// const enterWaitingRoomMessage = {
		// 	event: "enterWaitingRoom",
		// 	content: { clientId: this.clientInfo.id },
		// };
		// pingpongRoomSocket.send(JSON.stringify(enterWaitingRoomMessage));
		// // 대기실 입장 응답 받기
		// await new Promise(resolve => {
		// 	const listener = messageEvent => {
		// 		const { event, content } = JSON.parse(messageEvent.data);
		// 		if (event === "enterWaitingRoomResponse") {
		// 			pingpongRoomSocket.removeEventListener("message", listener);
		// 			resolve();
		// 		}
		// 	};
		// 	pingpongRoomSocket.addEventListener("message", listener);
		// });
		this.clientInfo.gameInfo = {
			pingpongRoomSocket,
			roomId,
			title: null,
			teamLeftList: [],
			teamRightList: [],
			teamLeftMode: "human",
			teamRightMode: "human",
			teamLeftTotalPlayerCount: 1,
			teamRightTotalPlayerCount: 1,
			teamLeftAbility: null,
			teamRightAbility: null,
		};
	}

	async _enterPingpongRoom() {
		// 바로 준비 완료 메시지 보내기
		const changeReadyStateMessage = {
			event: "changeReadyState",
			content: { state: "READY" },
		};
		this.clientInfo.gameInfo.pingpongRoomSocket.send(JSON.stringify(changeReadyStateMessage));
		// 3초 후 notifyGameStart 메시지 받기
		const { boardInfo, playerInfo } = await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "notifyGameStart") {
					this.clientInfo.gameInfo.pingpongRoomSocket.removeEventListener("message", listener);
					resolve(content);
				}
			};
			this.clientInfo.gameInfo.pingpongRoomSocket.addEventListener("message", listener);
		});
		// teamLeftList, teamRightList 세팅 후 핑퐁룸 입장
		playerInfo.forEach(player => {
			let teamList;
			if (player.team === "left") {
				teamList = this.clientInfo.gameInfo.teamLeftList;
			} else if (player.team === "right") {
				teamList = this.clientInfo.gameInfo.teamRightList;
			}
			teamList.push({
				clinetId: player.clientId,
				clientNickname: this.clientInfo.tournamentInfo.tournamentClientList.find(p => p.id === player.id).nickname,
				readyState: "READY",
				ability: null,
				paddleWidth: player.paddleWidth,
				paddleHeight: player.paddleHeight,
			});
		});
		this.clientInfo.gameInfo.sizeInfo = boardInfo;
		this._unsubscribeWindow();
		console.log("START PINGPONG GAME");
		this._onStartPingpongGame();
	}

	_calculatePoints() {
		const winner = document.querySelector("#root").getBoundingClientRect();
		const final1 = document.querySelector(".subTree:first-of-type .final").getBoundingClientRect();
		const final2 = document.querySelector(".subTree:last-of-type .final").getBoundingClientRect();

		const getTopCenterPos = rect => {
			return { x: rect.left + rect.width / 2, y: rect.top };
		};
		const getBottomCenterPos = rect => {
			return { x: rect.left + rect.width / 2, y: rect.bottom };
		};

		const final1TopCenter = getTopCenterPos(final1);
		const final2TopCenter = getTopCenterPos(final2);
		const winnerBottomCenter = getBottomCenterPos(winner);

		const pointAboveFinal1 = {
			x: final1TopCenter.x,
			y: (final1TopCenter.y + winnerBottomCenter.y) / 2,
		};
		const pointAboveFinal2 = {
			x: final2TopCenter.x,
			y: (final2TopCenter.y + winnerBottomCenter.y) / 2,
		};
		const pointBelowWinner = { x: winnerBottomCenter.x, y: pointAboveFinal1.y };

		const semiFinal1 = document.querySelector(".subTree:first-of-type .semiFinal .player:first-of-type").getBoundingClientRect();
		const semiFinal2 = document.querySelector(".subTree:first-of-type .semiFinal .player:last-of-type").getBoundingClientRect();
		const semiFinal3 = document.querySelector(".subTree:last-of-type .semiFinal .player:first-of-type").getBoundingClientRect();
		const semiFinal4 = document.querySelector(".subTree:last-of-type .semiFinal .player:last-of-type").getBoundingClientRect();

		const semiFinal1TopCenter = getTopCenterPos(semiFinal1);
		const semiFinal2TopCenter = getTopCenterPos(semiFinal2);
		const semiFinal3TopCenter = getTopCenterPos(semiFinal3);
		const semiFinal4TopCenter = getTopCenterPos(semiFinal4);
		const final1BottomCenter = getBottomCenterPos(final1);
		const final2BottomCenter = getBottomCenterPos(final2);

		const pointAboveSemiFinal1 = {
			x: semiFinal1TopCenter.x,
			y: (semiFinal1TopCenter.y + final1BottomCenter.y) / 2,
		};
		const pointAboveSemiFinal2 = {
			x: semiFinal2TopCenter.x,
			y: (semiFinal2TopCenter.y + final1BottomCenter.y) / 2,
		};
		const pointAboveSemiFinal3 = {
			x: semiFinal3TopCenter.x,
			y: (semiFinal3TopCenter.y + final2BottomCenter.y) / 2,
		};
		const pointAboveSemiFinal4 = {
			x: semiFinal4TopCenter.x,
			y: (semiFinal4TopCenter.y + final2BottomCenter.y) / 2,
		};

		const pointBelowFinal1 = { x: final1BottomCenter.x, y: pointAboveSemiFinal1.y };
		const pointBelowFinal2 = { x: final2BottomCenter.x, y: pointAboveSemiFinal3.y };

		return {
			getTopCenterPos,
			getBottomCenterPos,
			final1TopCenter,
			final2TopCenter,
			winnerBottomCenter,
			pointAboveFinal1,
			pointAboveFinal2,
			pointBelowWinner,
			semiFinal1TopCenter,
			semiFinal2TopCenter,
			semiFinal3TopCenter,
			semiFinal4TopCenter,
			final1BottomCenter,
			final2BottomCenter,
			pointAboveSemiFinal1,
			pointAboveSemiFinal2,
			pointAboveSemiFinal3,
			pointAboveSemiFinal4,
			pointBelowFinal1,
			pointBelowFinal2,
		};
	}

	_renderBracketLine() {
		const elementCanvas = document.querySelector("#elementCanvas");
		elementCanvas.innerHTML = "";
		const lineCanvas = document.querySelector("#lineCanvas");
		lineCanvas.innerHTML = "";

		let pointBelowWinner;
		let pointBelowFinal1;
		let pointBelowFinal2;

		const getTopCenterPos = rect => {
			return { x: rect.left + rect.width / 2, y: rect.top };
		};
		const getBottomCenterPos = rect => {
			return { x: rect.left + rect.width / 2, y: rect.bottom };
		};
		const renderLines = () => {
			function createLine(pos1, pos2) {
				const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("x1", pos1.x);
				line.setAttribute("y1", pos1.y);
				line.setAttribute("x2", pos2.x);
				line.setAttribute("y2", pos2.y);
				line.setAttribute("stroke", "rgba(255, 255, 255, 0.3)");
				line.setAttribute("stroke-width", "0.1rem");
				lineCanvas.append(line);
				return line;
			}
			const winner = document.querySelector("#root").getBoundingClientRect();
			const final1 = document.querySelector(".subTree:first-of-type .final").getBoundingClientRect();
			const final2 = document.querySelector(".subTree:last-of-type .final").getBoundingClientRect();

			const final1TopCenter = getTopCenterPos(final1);
			const final2TopCenter = getTopCenterPos(final2);
			const winnerBottomCenter = getBottomCenterPos(winner);

			const pointAboveFinal1 = {
				x: final1TopCenter.x,
				y: (final1TopCenter.y + winnerBottomCenter.y) / 2,
			};
			const pointAboveFinal2 = {
				x: final2TopCenter.x,
				y: (final2TopCenter.y + winnerBottomCenter.y) / 2,
			};
			pointBelowWinner = { x: winnerBottomCenter.x, y: pointAboveFinal1.y };

			createLine(final1TopCenter, pointAboveFinal1).id = "finalLeftTeamTopToTop";
			createLine(final2TopCenter, pointAboveFinal2).id = "finalRightTeamTopToTop";
			createLine(pointAboveFinal1, pointBelowWinner).id = "finalLeftTeamAboveToRight";
			createLine(pointAboveFinal2, pointBelowWinner).id = "finalRightTeamAboveToLeft";
			createLine(pointBelowWinner, winnerBottomCenter).id = "finalAboveCenterToTop";

			const semiFinal1 = document.querySelector(".subTree:first-of-type .semiFinal .player:first-of-type").getBoundingClientRect();
			const semiFinal2 = document.querySelector(".subTree:first-of-type .semiFinal .player:last-of-type").getBoundingClientRect();
			const semiFinal3 = document.querySelector(".subTree:last-of-type .semiFinal .player:first-of-type").getBoundingClientRect();
			const semiFinal4 = document.querySelector(".subTree:last-of-type .semiFinal .player:last-of-type").getBoundingClientRect();

			const semiFinal1TopCenter = getTopCenterPos(semiFinal1);
			const semiFinal2TopCenter = getTopCenterPos(semiFinal2);
			const semiFinal3TopCenter = getTopCenterPos(semiFinal3);
			const semiFinal4TopCenter = getTopCenterPos(semiFinal4);
			const final1BottomCenter = getBottomCenterPos(final1);
			const final2BottomCenter = getBottomCenterPos(final2);

			const pointAboveSemiFinal1 = {
				x: semiFinal1TopCenter.x,
				y: (semiFinal1TopCenter.y + final1BottomCenter.y) / 2,
			};
			const pointAboveSemiFinal2 = {
				x: semiFinal2TopCenter.x,
				y: (semiFinal2TopCenter.y + final1BottomCenter.y) / 2,
			};
			const pointAboveSemiFinal3 = {
				x: semiFinal3TopCenter.x,
				y: (semiFinal3TopCenter.y + final2BottomCenter.y) / 2,
			};
			const pointAboveSemiFinal4 = {
				x: semiFinal4TopCenter.x,
				y: (semiFinal4TopCenter.y + final2BottomCenter.y) / 2,
			};

			pointBelowFinal1 = { x: final1BottomCenter.x, y: pointAboveSemiFinal1.y };
			pointBelowFinal2 = { x: final2BottomCenter.x, y: pointAboveSemiFinal3.y };

			createLine(semiFinal1TopCenter, pointAboveSemiFinal1).id = "leftSemiFinalLeftTeamTopToTop";
			createLine(semiFinal2TopCenter, pointAboveSemiFinal2).id = "leftSemiFinalRightTeamTopToTop";
			createLine(semiFinal3TopCenter, pointAboveSemiFinal3).id = "rightSemiFinalLeftTeamTopToTop";
			createLine(semiFinal4TopCenter, pointAboveSemiFinal4).id = "rightSemiFinalRightTeamTopToTop";

			createLine(pointAboveSemiFinal1, pointBelowFinal1).id = "leftSemiFinalLeftTeamAboveToRight";
			createLine(pointAboveSemiFinal2, pointBelowFinal1).id = "leftSemiFinalRightTeamAboveToLeft";
			createLine(pointAboveSemiFinal3, pointBelowFinal2).id = "rightSemiFinalLeftTeamAboveToRight";
			createLine(pointAboveSemiFinal4, pointBelowFinal2).id = "rightSemiFinalRightTeamAboveToLeft";

			createLine(pointBelowFinal1, final1BottomCenter).id = "leftSemiFinalAboveToTop";
			createLine(pointBelowFinal2, final2BottomCenter).id = "RightSemiFinalAboveToTop";
		};

		renderLines();
	}

	_renderCurrentTournamentInfo() {
		const elementCanvas = document.querySelector("#elementCanvas");
		elementCanvas.innerHTML = "";
		const lineCanvas = document.querySelector("#lineCanvas");
		lineCanvas.innerHTML = "";

		let pointBelowWinner;
		let pointBelowFinal1;
		let pointBelowFinal2;

		const getTopCenterPos = rect => {
			return { x: rect.left + rect.width / 2, y: rect.top };
		};
		const getBottomCenterPos = rect => {
			return { x: rect.left + rect.width / 2, y: rect.bottom };
		};
		const renderLines = () => {
			function createLine(pos1, pos2) {
				const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
				line.setAttribute("x1", pos1.x);
				line.setAttribute("y1", pos1.y);
				line.setAttribute("x2", pos2.x);
				line.setAttribute("y2", pos2.y);
				line.setAttribute("stroke", "rgba(255, 255, 255, 0.3)");
				line.setAttribute("stroke-width", "0.1rem");
				lineCanvas.append(line);
				return line;
			}
			const winner = document.querySelector("#root").getBoundingClientRect();
			const final1 = document.querySelector(".subTree:first-of-type .final").getBoundingClientRect();
			const final2 = document.querySelector(".subTree:last-of-type .final").getBoundingClientRect();

			const final1TopCenter = getTopCenterPos(final1);
			const final2TopCenter = getTopCenterPos(final2);
			const winnerBottomCenter = getBottomCenterPos(winner);

			const pointAboveFinal1 = {
				x: final1TopCenter.x,
				y: (final1TopCenter.y + winnerBottomCenter.y) / 2,
			};
			const pointAboveFinal2 = {
				x: final2TopCenter.x,
				y: (final2TopCenter.y + winnerBottomCenter.y) / 2,
			};
			pointBelowWinner = { x: winnerBottomCenter.x, y: pointAboveFinal1.y };

			createLine(final1TopCenter, pointAboveFinal1).id = "finalLeftTeamTopToTop";
			createLine(final2TopCenter, pointAboveFinal2).id = "finalRightTeamTopToTop";
			createLine(pointAboveFinal1, pointBelowWinner).id = "finalLeftTeamAboveToRight";
			createLine(pointAboveFinal2, pointBelowWinner).id = "finalRightTeamAboveToLeft";
			createLine(pointBelowWinner, winnerBottomCenter).id = "finalAboveCenterToTop";

			const semiFinal1 = document.querySelector(".subTree:first-of-type .semiFinal .player:first-of-type").getBoundingClientRect();
			const semiFinal2 = document.querySelector(".subTree:first-of-type .semiFinal .player:last-of-type").getBoundingClientRect();
			const semiFinal3 = document.querySelector(".subTree:last-of-type .semiFinal .player:first-of-type").getBoundingClientRect();
			const semiFinal4 = document.querySelector(".subTree:last-of-type .semiFinal .player:last-of-type").getBoundingClientRect();

			const semiFinal1TopCenter = getTopCenterPos(semiFinal1);
			const semiFinal2TopCenter = getTopCenterPos(semiFinal2);
			const semiFinal3TopCenter = getTopCenterPos(semiFinal3);
			const semiFinal4TopCenter = getTopCenterPos(semiFinal4);
			const final1BottomCenter = getBottomCenterPos(final1);
			const final2BottomCenter = getBottomCenterPos(final2);

			const pointAboveSemiFinal1 = {
				x: semiFinal1TopCenter.x,
				y: (semiFinal1TopCenter.y + final1BottomCenter.y) / 2,
			};
			const pointAboveSemiFinal2 = {
				x: semiFinal2TopCenter.x,
				y: (semiFinal2TopCenter.y + final1BottomCenter.y) / 2,
			};
			const pointAboveSemiFinal3 = {
				x: semiFinal3TopCenter.x,
				y: (semiFinal3TopCenter.y + final2BottomCenter.y) / 2,
			};
			const pointAboveSemiFinal4 = {
				x: semiFinal4TopCenter.x,
				y: (semiFinal4TopCenter.y + final2BottomCenter.y) / 2,
			};

			pointBelowFinal1 = { x: final1BottomCenter.x, y: pointAboveSemiFinal1.y };
			pointBelowFinal2 = { x: final2BottomCenter.x, y: pointAboveSemiFinal3.y };

			createLine(semiFinal1TopCenter, pointAboveSemiFinal1).id = "leftSemiFinalLeftTeamTopToTop";
			createLine(semiFinal2TopCenter, pointAboveSemiFinal2).id = "leftSemiFinalRightTeamTopToTop";
			createLine(semiFinal3TopCenter, pointAboveSemiFinal3).id = "rightSemiFinalLeftTeamTopToTop";
			createLine(semiFinal4TopCenter, pointAboveSemiFinal4).id = "rightSemiFinalRightTeamTopToTop";

			createLine(pointAboveSemiFinal1, pointBelowFinal1).id = "leftSemiFinalLeftTeamAboveToRight";
			createLine(pointAboveSemiFinal2, pointBelowFinal1).id = "leftSemiFinalRightTeamAboveToLeft";
			createLine(pointAboveSemiFinal3, pointBelowFinal2).id = "rightSemiFinalLeftTeamAboveToRight";
			createLine(pointAboveSemiFinal4, pointBelowFinal2).id = "rightSemiFinalRightTeamAboveToLeft";

			createLine(pointBelowFinal1, final1BottomCenter).id = "leftSemiFinalAboveToTop";
			createLine(pointBelowFinal2, final2BottomCenter).id = "RightSemiFinalAboveToTop";
		};
		const renderElements = () => {
			function setElementPos(type, element) {
				if (type === "final") {
					element.style.top = `${pointBelowWinner.y * 1.04}px`;
					element.style.left = `${pointBelowWinner.x}px`;
				} else if (type === "leftSemiFinal") {
					element.style.top = `${pointBelowFinal1.y * 1.02}px`;
					element.style.left = `${pointBelowFinal1.x}px`;
				} else if (type === "rightSemiFinal") {
					element.style.top = `${pointBelowFinal2.y * 1.02}px`;
					element.style.left = `${pointBelowFinal2.x}px`;
				}
			}

			async function startObserveGame(roomId) {
				const pingpongRoomSocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/pingpong-room/${roomId}`, ['authorization', this.clientInfo.accessToken]);
				await new Promise(resolve => {
					pingpongRoomSocket.addEventListener("open", () => {
						resolve();
					});
				});

				const requestObserveMessage = {
					event: "requestObserve",
					content: {
						clientId: this.clientInfo.id,
					},
				};
				pingpongRoomSocket.send(JSON.stringify(requestObserveMessage));

				const { playerInfo, teamInfo, boardInfo } = await new Promise(resolve => {
					pingpongRoomSocket.addEventListener("message", function listener(messageEvent) {
						const { event, content } = JSON.parse(messageEvent.data);
						if (event === "requestObserveResponse") {
							pingpongRoomSocket.removeEventListener("message", listener);
							resolve(content);
						}
					});
				});
				const teamLeftList = playerInfo.filter(player => player.team === "left");
				const teamRightList = playerInfo.filter(player => player.team === "right");
				this.clientInfo.gameInfo = {
					role: "observer",
					pingpongRoomSocket,
					teamLeftList,
					teamRightList,
					teamLeftMode: teamInfo.leftTeamAbilitfy,
					teamrightMode: teamInfo.rightTeamAbilitfy,
					teamLeftScore: teamInfo.leftTeamScore,
					teamRightScore: teamInfo.rightTeamScore,
					sizeInfo: {
						boardWidth: boardInfo.boardWidth,
						boardHeight: boardInfo.boardHeight,
						ballRadius: boardInfo.ballRadius,
					},
				};
			}

			function createObserveButton(type) {
				const observeButton = document.createElement("button");
				observeButton.classList.add("generalButton", "observeButton");
				observeButton.textContent = "관전하기";
				//roomId 바인딩 하기
				observeButton.addEventListener("click", startObserveGame);
				setElementPos(type, observeButton);
				elementCanvas.append(observeButton);
			}
			function createScoreBox(type, leftScore, rightScore) {
				const scoreBox = document.createElement("div");
				scoreBox.classList.add("scoreBox");
				scoreBox.innerHTML = `
					<div class="score">${leftScore}</div>
					<div class="score">${rightScore}</div>
				`;
				setElementPos(type, scoreBox);
				elementCanvas.append(scoreBox);
			}
			const stages = [...this.tournamentInfo.final, ...this.tournamentInfo.semiFinal];
			const types = ["final", "leftSemiFinal", "rightSemiFinal"];
			stages.forEach((stage, index) => {
				if (stage.state === "isPlaying") {
					createObserveButton(types[index]);
				} else if (stage.state == "finished") {
					createScoreBox(types[index], ...stage.score);
				}
			});
		};

		const renderPlayer = () => {
			if (this.tournamentInfo.final[0].state !== "notStarted") {
				this._renderPlayer("leftSemiFinal");
				this._renderPlayer("rightSemiFinal");
			}
			if (this.tournamentInfo.final[0].state === "finished") {
				this._renderPlayer("final");
			}
		};

		const renderPolyline = () => {
			function setPolylinePoints(polyline, pointList){
				polyline.setAttribute("points", pointList.reduce((acc, cur, idx)=>acc+`${cur.x} ${cur.y}${idx!==pointList.length-1?",":""}`, ""));
			}
			if (this.tournamentInfo.final[0].state !== "notStarted") {
				const leftPolyline = this._addPolylineInCanvas();
				const leftPointList = this._getPointListForPolyline("leftSemiFinal");
				setPolylinePoints(leftPolyline, leftPointList);
				const rightPolyline = this._addPolylineInCanvas();
				const rightPointList = this._getPointListForPolyline("rightSemiFinal");
				setPolylinePoints(rightPolyline, rightPointList);
			}
			if (this.tournamentInfo.final[0].state === "finished") {
				const finalPolyline = this._addPolylineInCanvas();
				const finalPointList = this._getPointListForPolyline("final");
				setPolylinePoints(finalPolyline, finalPointList);
			}
		};

		renderLines();
		renderPlayer();
		renderElements();
		renderPolyline();
	}

	_getHTML() {
		return `
			<div id="container">
				${this._getRootHTML()}
				${this._getSubTreesHTML()}
			</div>
			<svg id="lineCanvas"></svg>
			<div id="elementCanvas"></div>
		`;
	}

	_getRootHTML() {
		return `
			<div id="root">
				${this._getEmptyPlayerHTML(true)}
			</div>
		`;
	}

	_getSubTreesHTML() {
		return `
			<div id="subTrees">
				${this._getSubTreeHTML(this.clientInfo.tournamentInfo.tournamentClientList.slice(0, 2))}
				${this._getSubTreeHTML(this.clientInfo.tournamentInfo.tournamentClientList.slice(2, 4))}
			</div>
		`;
	}
	_getSubTreeHTML(semiFinalist) {
		return `
			<div class="subTree">
				<div class="final">
					${this._getEmptyPlayerHTML()}
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
					${isWinner ? '<img class="crownImg" src="images/tournamentCrown.png">' : ""}
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
						<img class="avatarImg fadeInEffect" src="${player.avatarUrl}">
					</div>
					${isWinner ? '<img class="crownImg" src="images/tournamentCrown.png">' : ""}
				</div>
				<div class="nickname">
					<div class="nicknameText">${player.nickname}</div>
				</div>
			</div>
		`;
	}

	_getWinningPlayer(score, clientIdList) {
		const [score1, score2] = score;
		const [clientId1, clientId2] = clientIdList;
		const winnerId = score1 > score2 ? clientId1 : clientId2;
		return this.clientInfo.tournamentInfo.tournamentClientList.find(player => player.id === winnerId);
	}
}

export default TournamentAnimationPageManager;