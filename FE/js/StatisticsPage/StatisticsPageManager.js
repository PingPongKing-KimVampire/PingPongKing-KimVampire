import windowObservable from "../../WindowObservable.js";

class StatisticsPageManager {
	constructor(app, clientInfo) {
		console.log('Statistics Page!');
		this.app = app;
		this.clientInfo = clientInfo;
	}

	connectPage() {
		// const { profileId, gameId } = this.clientInfo.statisticsInfo;
		// this.profileId = profileId;
		// this.gameId = gameId;
	}

	clearPage() {
		this._unsubscribeWindow();
	}

	async initPage() {
		// const { timestamp, 
		// 		score, 
		// 		mode, 
		// 		teamKind, 
		// 		ability, 
		// 		myTeamClientInfoList, 
		// 		opponnetTeamClientInfoList, 
		// 		word, 
		// 		scoreList, 
		// 		myTeam,
		// 		hitMapList,
		// 		boardInfo } = await this._getClientGameDetail(this.profileId, this.gameId);

		// TODO : 임시 하드 코딩
		this.word = "그 실력에 잠이 오냐?";
		this.hitMapList = {
			1 : [{"type" : "SCORE", "y" : 1000, "x" : 1550}, 
				{"type" : "PADDLE", "y" : 0, "x" : 0}],
	 		2 : [{"type" : "SCORE", "y" : 1000, "x" : 0},
				{"type" : "PADDLE", "y" : 0, "x" : 1550}],
			3 : [{"type" : "SCORE", "y" : 500, "x" : 775},
				{"type" : "PADDLE", "y" : 800, "x" : 300}],	
			4 : [{"type" : "SCORE", "y" : 1000, "x" : 750},
				{"type" : "PADDLE", "y" : 400, "x" : 1550}],	
			5 : [{"type" : "SCORE", "y" : 123, "x" : 259},
				{"type" : "PADDLE", "y" : 876, "x" : 1200}],	
			6 : [{"type" : "SCORE", "y" : 500, "x" : 1400},
				{"type" : "PADDLE", "y" : 800, "x" : 300}],	
		}
		const scoreList = ["win", "lose", "win", "win", "win", "win"];
		const { myPoints, opponentPoints } = this._getPoints(scoreList);
		this.myPoints = myPoints;
		this.opponentPoints = opponentPoints;
		this.round = scoreList.length;
		this.winningScore = Math.max(...myPoints, ...opponentPoints);
		// this.myTeam = myTeam;
		this.myTeam = 'left';
		// this.boardInfo = boardInfo;
		this.boardInfo = {
			boardHeight: 1000,
			boardWidth: 1550,
			ballRadius: 25
		}
		
		this.app.innerHTML = this._getHTML();
		this._subscribeWindow();
		this._setHitMap();
		requestAnimationFrame(this._renderScoreGraph.bind(this));
		requestAnimationFrame(this._renderHitMap.bind(this, 1));
	}

	async _getClientGameDetail(clientId, gameId) {
		const getClientGameDetailMessage = {
			event: "getClientGameDetail",
			content: { clientId, gameId }
		};
		this.clientInfo.socket.send(JSON.stringify(getClientGameDetailMessage));
		return await new Promise(resolve => {
			const listener = messageEvent => {
				const { event, content } = JSON.parse(messageEvent.data);
				if (event === "getClientGameDetailResponse") {
					this.clientInfo.socket.removeEventListener("message", listener);
					resolve(content);
				}
			};
			this.clientInfo.socket.addEventListener("message", listener);
		});
	}

	_getPoints(scoreList) {
		let myPoint = 0;
		let opponentPoint = 0;
		const myPoints = [];
		const opponentPoints = [];
		scoreList.forEach((score) => {
			if (score === 'win') {
				myPoint++;
			} else if (score === 'lose') {
				opponentPoint++;
			}
			myPoints.push(myPoint);
			opponentPoints.push(opponentPoint);
		});
		return { myPoints, opponentPoints };
	}

	_subscribeWindow() {
		this._renderScoreGraphRef = this._renderScoreGraph.bind(this);
		windowObservable.subscribeResize(this._renderScoreGraphRef);
	}
	_unsubscribeWindow() { // TODO : 화면 나갈 때 호출하기
		windowObservable.unsubscribeResize(this._renderScoreGraphRef);
	}

	_renderScoreGraph() {
		const lineCanvas = document.querySelector('#graphLineCanvas');
		lineCanvas.innerHTML = '';
		const circleCanvas = document.querySelector('#graphCircleCanvas');
		circleCanvas.innerHTML = '';
		const graphRect = document.querySelector('#graphContainer').getBoundingClientRect();
		const scale = { x: graphRect.width / this.round, y: graphRect.height / this.winningScore };

		const renderLine = (points, color) => {
			const createLine = (pos1, pos2, color) => {
				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', pos1.x);
				line.setAttribute('y1', pos1.y);
				line.setAttribute('x2', pos2.x);
				line.setAttribute('y2', pos2.y);
				line.setAttribute('stroke', color);
				line.setAttribute('stroke-width', '0.3rem');
				lineCanvas.append(line);
			}
			const createCircle = (pos, round) => {
				const circleButton = document.createElement('button');
				circleButton.classList.add('circleButton');
				circleButton.style.left = `${pos.x}px`;
				circleButton.style.top = `${pos.y}px`;
				circleButton.addEventListener('click', () => {
					clearInterval(this.renderHitMapIntervalID);
					this._renderHitMap(round);
				});
				circleCanvas.append(circleButton);
			}
			let prevPoint = { 
				x: window.scrollX + graphRect.left, 
				y: window.scrollY + graphRect.bottom
			}
			points.forEach((point, index) => {
				const currentPoint = {
					x: window.scrollX + graphRect.left + ((index + 1) * scale.x),
					y: window.scrollY + graphRect.bottom - (point * scale.y)
				}
				createLine(prevPoint, currentPoint, color);
				createCircle(currentPoint, index + 1);
				prevPoint = currentPoint;
			});
		}

		renderLine(this.myPoints, '#BEBEBE');
		renderLine(this.opponentPoints, '#D570FF');
	}

	_setHitMap() {
		this.hitMapLabel = document.querySelector("#hitMapContainer .label");
		this.hitMapPanel = document.querySelector('#hitMapPanel');
		this.currentRound = 1;
		const interval = 1.5; // 초 단위
		this.renderHitMapIntervalID = setInterval(() => {
			this.currentRound++;
			if (this.round < this.currentRound) this.currentRound = 1;
			this._renderHitMap(this.currentRound);
		}, interval * 1000);
	}

	_renderHitMap(round) {
		this.hitMapLabel.textContent = `${round} 라운드 타점 지도`;

		const removeBalls = () => {
			const children = Array.from(this.hitMapPanel.children);
			children.forEach((child) => {
				if (child.classList.contains('scoreBall') ||
					child.classList.contains('paddleBall')) {
					this.hitMapPanel.removeChild(child);
				}
			});
		}
		removeBalls();

		const { boardHeight, boardWidth, ballRadius } = this.boardInfo;
		const ballSizePercent = ((ballRadius * 2) / boardWidth) * 100;
		const yTotalPercent = ((boardHeight - (ballRadius * 2)) / boardHeight) * 100;
		const xTotalPercent = ((boardWidth - (ballRadius * 2)) / boardWidth)  * 100;

		const renderBall = (type, x, y) => {
			const ball = document.createElement("div");
			if (type === 'SCORE') {
				ball.classList.add('scoreBall');
			} else if (type === 'PADDLE') {
				ball.classList.add('paddleBall');
			}
			ball.style.width = `${ballSizePercent}%`;
			ball.style.height = 'auto';
			ball.style.aspectRatio = '1/1';
			const yPercent = (y / boardHeight) * yTotalPercent;
			const xPercent = (x / boardWidth) * xTotalPercent;
			ball.style.top = `${yPercent}%`;
			ball.style.left = this.myTeam === "right" ? `${xPercent}%` : `${xTotalPercent - xPercent}%`;
			this.hitMapPanel.append(ball);
		}

		this.hitMapList[round].forEach(({type, x, y}) => {
			renderBall(type, x, y);
		});
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				${this._getMainInfoContainerHTML()}
				${this._getSubInfoContainerHTML()}
			</div>
			<svg id="graphLineCanvas"></svg>
			<div id="graphCircleCanvas"></div>
		`;
	}
	_getMainInfoContainerHTML() {
		return `
			<div id="mainInfoContainer">
				${this._getMainPanelHTML()}
				${this._getWordPanelHTML(this.word)}
			</div>
		`;
	}
	_getMainPanelHTML() {
		return `
			<div id="mainPanel"></div>
		`;
	}
	_getWordPanelHTML(word) {
		return `
			<div id="wordPanel">
				<div id="wordTitle">탁구왕 김뱀파이어의 한 마디</div>
				<div id="word">${word}</div>
			</div>
		`;
	}
	_getSubInfoContainerHTML() {
		return `
			<div id="subInfoContainer">
				<div id="scoreGraphContainer">
					<label class="label">라운드 별 점수</label>
					${this._getScorePanelHTML()}
				</div>
				<div id="hitMapContainer">
					<label class="label">n라운드 타점 지도</label>
					${this._getHitMapPanelHTML()}
				</div>
			</div>
		`;
	}
	_getScorePanelHTML() {
		return `
			<div id="scorePanel">
				<div id="graphContainer">
					<div id="xLabels">
						${this._getGraphLabelsHTML(0, this.round)}
						</div>
					<div id="yLabels">
						${this._getGraphLabelsHTML(0, this.winningScore)}
					</div>
				</div>
			</div>
		`;
	}
	_getGraphLabelsHTML(start, end) {
		let labels = '';
		for (let count = start; count <= end; count++) {
			labels += `<div>${count}</div>`;
		}
		return labels;
	}
	_getHitMapPanelHTML() {
		return `
			<div id="hitMapPanel">
				<div class="subBoard"></div>
				<div class="subBoard"></div>
				<div class="ball"></div>
			</div>
		`;
	}
}

export default StatisticsPageManager;