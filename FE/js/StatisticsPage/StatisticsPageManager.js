import windowObservable from "../../WindowObservable.js";

class StatisticsPageManager {
	constructor(app, clientInfo) {
		this.app = app;
		this.clientInfo = clientInfo;
		this._initPage();
	}

	async _initPage() {
		// TODO : timestamp ~ opponnetTeamClientInfoList 까지는 이전에 받았던 거 재활용할 수 없을까?
		// TODO : profileTarget.id랑 gameId는 어떻게 얻어올 수 있을까?
		// const { timestamp, 
		// 		score, 
		// 		mode, 
		// 		teamKind, 
		// 		ability, 
		// 		myTeamClientInfoList, 
		// 		opponnetTeamClientInfoList, 
		// 		word, 
		// 		scoreList, 
		// 		hitMapList } = await this._getClientGameDetail(profileTarget.id, gameId);

		// TODO : 임시 하드 코딩
		this.word = "그 실력에 잠이 오냐?";
		this.hitMap = {
			1 : [{"type" : "SCORE", "y" : 1000, "x" : 1550}, 
				{"type" : "PADDLE", "y" : 0, "x" : 0}],
	 		2 : [{"type" : "SCORE", "y" : 1000, "x" : 0},
				{"type" : "PADDLE", "y" : 0, "x" : 1550}],
			3 : [{"type" : "SCORE", "y" : 500, "x" : 775},
				{"type" : "PADDLE", "y" : 800, "x" : 300}],	
		}
		const scoreList = ["win", "lose", "win", "win", "win", "win"];
		const { myPoints, opponentPoints } = this._getPoints(scoreList);
		this.myPoints = myPoints;
		this.opponentPoints = opponentPoints;
		this.round = scoreList.length;
		this.winningScore = 5;
		
		this.app.innerHTML = this._getHTML();
		this._subscribeWindow();
		requestAnimationFrame(this._renderScoreGraph.bind(this));
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
			function createLine(pos1, pos2, color) {
				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('x1', pos1.x);
				line.setAttribute('y1', pos1.y);
				line.setAttribute('x2', pos2.x);
				line.setAttribute('y2', pos2.y);
				line.setAttribute('stroke', color);
				line.setAttribute('stroke-width', '0.3rem');
				lineCanvas.append(line);
			}
			function createCircle(pos) {
				const circleButton = document.createElement('button');
				circleButton.classList.add('circleButton');
				circleButton.style.left = `${pos.x}px`;
				circleButton.style.top = `${pos.y}px`;
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
				createCircle(currentPoint);
				prevPoint = currentPoint;
			});
		}

		renderLine(this.myPoints, '#BEBEBE');
		renderLine(this.opponentPoints, '#D570FF');
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
			<div id="hitMapPanel"></div>
		`;
	}
}

export default StatisticsPageManager;