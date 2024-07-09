class TournamentPageManager {
	constructor(app, clientInfo) {
		this.app = app;
		this.clientInfo = clientInfo;

		this.playerList = [
			{
				clientId : 1,
				clientNickname : "김뱀파이어",
				avartarUrl : "images/playerA.png"
			},
			{ 
				clientId : 2,
				clientNickname : "김뱀파이",
				avartarUrl : "images/playerA.png"
			},
			{ 
				clientId : 3,
				clientNickname : "김뱀파",
				avartarUrl : "images/playerA.png"
			},
			{ 
				clientId : 4,
				clientNickname : "김뱀",
				avartarUrl : "images/playerA.png"
			}
		];

		this._initPage();
	}

	_initPage() {
		this.app.innerHTML = this._getHTML();
		requestAnimationFrame(this._renderLines);
	}

	_renderLines() {
		const svgCanvas = document.querySelector('#svgCanvas');
		svgCanvas.innerHTML = '';
		function drawLine(pos1, pos2) {
			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', pos1.x);
			line.setAttribute('y1', pos1.y);
			line.setAttribute('x2', pos2.x);
			line.setAttribute('y2', pos2.y);
			line.setAttribute('stroke', 'white');
			line.setAttribute('stroke-width', 2);
			svgCanvas.append(line);
		}
		function getTopCenterPos(rect, bool) {
			return { x: rect.left + (rect.width / 2), y: rect.top };
		}
		function getBottomCenterPos(rect) {
			return { x: rect.left + (rect.width / 2), y: rect.bottom };
		}

		const f = document.querySelector('#root').getBoundingClientRect();
		const sf1 = document.querySelector('.subTree:first-of-type .semiFinal').getBoundingClientRect();
		const sf2 = document.querySelector('.subTree:last-of-type .semiFinal').getBoundingClientRect();
	
		const sf1TopCenter = getTopCenterPos(sf1);
		const sf2TopCenter = getTopCenterPos(sf2);
		const fBottomCenter = getBottomCenterPos(f);
	
		const pointAboveSf1 = { x: sf1TopCenter.x, y: (sf1TopCenter.y + fBottomCenter.y) / 2 }
		const pointAboveSf2 = { x: sf2TopCenter.x, y: (sf2TopCenter.y + fBottomCenter.y) / 2 }
		const pointBelowWinner = { x: fBottomCenter.x, y: pointAboveSf1.y }
	
		drawLine(sf1TopCenter, pointAboveSf1);
		drawLine(sf2TopCenter, pointAboveSf2);
		drawLine(pointAboveSf1, pointBelowWinner);
		drawLine(pointAboveSf2, pointBelowWinner);
		drawLine(fBottomCenter, pointBelowWinner);
	
		const p1 = document.querySelector('.subTree:first-of-type .participants .player:first-of-type').getBoundingClientRect();
		const p2 = document.querySelector('.subTree:first-of-type .participants .player:last-of-type').getBoundingClientRect();
		const p3 = document.querySelector('.subTree:last-of-type .participants .player:first-of-type').getBoundingClientRect();
		const p4 = document.querySelector('.subTree:last-of-type .participants .player:last-of-type').getBoundingClientRect();

		const p1TopCenter = getTopCenterPos(p1, true);
		const p2TopCenter = getTopCenterPos(p2, true);
		const p3TopCenter = getTopCenterPos(p3, true);
		const p4TopCenter = getTopCenterPos(p4, true);
		const sf1BottomCenter = getBottomCenterPos(sf1);
		const sf2BottomCenter = getBottomCenterPos(sf2);
	
		const pointAboveP1 = { x: p1TopCenter.x, y: (p1TopCenter.y + sf1BottomCenter.y) / 2 };
		const pointAboveP2 = { x: p2TopCenter.x, y: (p2TopCenter.y + sf1BottomCenter.y) / 2 };
		const pointAboveP3 = { x: p3TopCenter.x, y: (p3TopCenter.y + sf2BottomCenter.y) / 2 };
		const pointAboveP4 = { x: p4TopCenter.x, y: (p4TopCenter.y + sf2BottomCenter.y) / 2 };

		const pointBelowSf1 = { x: sf1BottomCenter.x, y: pointAboveP1.y };
		const pointBelowSf2 = { x: sf2BottomCenter.x, y: pointAboveP3.y };
	
		drawLine(p1TopCenter, pointAboveP1);
		drawLine(p2TopCenter, pointAboveP2);
		drawLine(p3TopCenter, pointAboveP3);
		drawLine(p4TopCenter, pointAboveP4);
	
		drawLine(pointAboveP1, pointBelowSf1);
		drawLine(pointAboveP2, pointBelowSf1);
		drawLine(pointAboveP3, pointBelowSf2);
		drawLine(pointAboveP4, pointBelowSf2);
	
		drawLine(sf1BottomCenter, pointBelowSf1);
		drawLine(sf2BottomCenter, pointBelowSf2);
	}

	_getHTML() {
		return `
			<div id="container">
				${this._getRootHTML(null)}
				${this._getSubTreesHTML(this.playerList)}
			</div>
			<svg id="svgCanvas"></svg>
		`;
	}
	_getRootHTML(finalist) {
		return `
			<div id="root">
				${finalist ? this._getPlayerHTML(finalist) : this._getEmptyPlayerHTML()}
			</div>
		`;
	}
	_getSubTreesHTML(playerList) {
		return `
			<div id="subTrees">
				${this._getSubTreeHTML(null, playerList.slice(0, 2))}
				${this._getSubTreeHTML(null, playerList.slice(2))}
			</div>
		`;
	}
	_getSubTreeHTML(semiFinalist, participants) {
		return `
			<div class="subTree">
				<div class="semiFinal">
					${semiFinalist ? this._getPlayerHTML(semiFinalist) : this._getEmptyPlayerHTML()}
				</div>
				<div class="participants">
					${this._getPlayerHTML(participants[0])}
					${this._getPlayerHTML(participants[1])}
				</div>
			</div>
		`;
	}
	_getEmptyPlayerHTML() {
		return `
			<div class="avatarImgFrame emptyFrame">
				<div class="avatarQuestionMark">?</div>
			</div>
			<div class="nickname">?</div>
		`;
	}
	_getPlayerHTML(player) {
		return `
			<div class="player">
				<div class="avatarImgFrame">
					<img class="avatarImg" src="${player.avartarUrl}">
				</div>
				<div class="nickname">${player.clientNickname}</div>
			</div>
		`;
	}
}

export default TournamentPageManager;