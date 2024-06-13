class WaitingRoomCreationPageManager {
	constructor(app) {
		console.log("Create Waiting Room Page!");
		app.innerHTML = this._getHTML();

		this.titleInput = document.querySelector('#titleInput');
		this.modeButtons = document.getElementsByName('mode');
		this.humanCountButtons = document.getElementsByName('humanCount');
		this.completeButton = document.querySelector('#completeButton');

		// window.addEventListener('click', this._checkSelectedAll.bind(this));

		// this.titleInput.addEventListener('input', () => {
		// 	console.log('titleInput changed');
		// });
		// this.modeButtons.forEach((modeButton) => {
		// 	modeButton.addEventListener('change', () => {
		// 		console.log('mode button changed');
		// 	});
		// });
		// this.humanCountButtons.forEach((humanCountButton) => {
		// 	humanCountButton.addEventListener('change', () => {
		// 		console.log('human count button changed');
		// 	});
		// });
	}

	_checkSelectedAll() {
		let isSelectedTitle = false;
		let isSelectedMode = false;
		let isSelectedHumanCount = false;

		if (this.titleInput.value !== "")
			isSelectedTitle = true;
		console.log(this.titleInput.value);
		this.modeButtons.forEach((modeButton) => {
			if (modeButton.checked === true)
				isSelectedMode = true;
		})
		this.humanCountButtons.forEach((humanCountButton) => {
			if (humanCountButton.checked === true)
				isSelectedHumanCount = true;
		})

		if (isSelectedTitle && isSelectedMode && isSelectedHumanCount) {
			this.completeButton.classList.replace('disabledButton', 'activatedButton');
		} else {
			this.completeButton.classList.replace('activatedButton', 'disabledButton');
		}
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="roomSettingContainer">
				<div class="selectionGroup">${this._getTitleSelectionHTML()}</div>
				<div class="selectionGroup">${this._getModeSelectionHTML()}</div>
				<div class="selectionGroup">${this._getPlayerCountSelectionHTML()}</div>
			</div>
			<button id="completeButton" class="disabledButton">방 생성하기</button>
		`;
	}

	_getTitleSelectionHTML() {
		return `
			<label class="selectionLabel" for="titleInput">방 제목</label>
			<input type="text" id="titleInput">
		`;
	}

	_getModeSelectionHTML() {
		return `
			<label class="selectionLabel">모드</label>
			<input type="radio" name="mode" id="humanVsHuman" value="humanVsHuman">
			<label for=humanVsHuman class="modeButton">인간 VS 인간</label>
			<input type="radio" name="mode" id="vampireVsVampire" value="vampireVsVampire">
			<label for=vampireVsVampire class="modeButton">뱀파이어 VS 뱀파이어</label>
			<input type="radio" name="mode" id="vampireVsHuman" value="vampireVsHuman">
			<label for=vampireVsHuman class="modeButton">뱀파이어 VS 인간</label>
		`;
	}

	_getPlayerCountSelectionHTML() {
		return `
			<label class="selectionLabel">인간</label>
			<div class="countButtonGroup" id="humanCountButtonGroup">
				<input type="radio" name="humanCount" id="human2" , value="2">
				<label for="human2" class="countButton">2</label>
				<input type="radio" name="humanCount" id="human3" , value="3">
				<label for="human3" class="countButton">3</label>
				<input type="radio" name="humanCount" id="human4" , value="4">
				<label for="human4" class="countButton">4</label>
				<input type="radio" name="humanCount" id="human5" , value="5">
				<label for="human5" class="countButton">5</label>
				<input type="radio" name="humanCount" id="human6" , value="6">
				<label for="human6" class="countButton">6</label>
			</div>
			<div class="countText">명</div>
			<div id="vsText">VS</div>
			<label class="selectionLabel" id="vampireLabel">뱀파이어</label>
			<div class="countButtonGroup" id="vampireCounButtonGroup">
			<input type="radio" name="vampireCountInput" id="vampire1", value="1" checked="checked">
			<label for="vampire1" class="countButton">2</label>
			</div>
			<div class="countText">명</div>
		`;
	}

}

export default WaitingRoomCreationPageManager;