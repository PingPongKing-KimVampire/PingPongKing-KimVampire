class StatisticsPageManager {
	constructor(app, clientInfo) {
		this.app = app;
		this.clientInfo = clientInfo;

		this._initPage();
	}
	
	_initPage() {
		this.app.innerHTML = this._getHTML();
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				${this._getMainInfoContainerHTML()}
				${this._getSubInfoContainerHTML()}
			</div>
		`;
	}
	_getMainInfoContainerHTML() {
		return `
			<div id="mainInfoContainer">
				${this._getMainPanelHTML()}
				${this._getWordPanelHTML()}
			</div>
		`;
	}
	_getMainPanelHTML() {
		return `
			<div id="mainPanel"></div>
		`;
	}
	_getWordPanelHTML() {
		return `
			<div id="wordPanel">
				<div id="wordTitle">탁구왕 김뱀파이어의 한 마디</div>
				<div id="word">"그 실력에 잠이 오냐?"</div>
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
			<div id="scorePanel"></div>
		`;
	}
	_getHitMapPanelHTML() {
		return `
			<div id="hitMapPanel"></div>
		`;
	}
}

export default StatisticsPageManager;