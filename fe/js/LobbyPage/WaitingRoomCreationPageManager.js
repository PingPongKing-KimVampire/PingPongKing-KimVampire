class WaitingRoomCreationPageManager {
	constructor(app) {
		console.log("Create Waiting Room Page!");
		app.innerHTML = this._getHTML();

		this.completeButtonEnabled = false;
		this.completeButton = document.querySelector('#completeButton');

		this.titleInput = document.querySelector('#titleInput');
		this.modeSelection = document.querySelector('.selectionGroup:nth-of-type(2)');
		this.modeButtons = [...document.getElementsByName('mode')];
		this.countSelection = document.querySelector('.selectionGroup:last-of-type');
		this.humanCountButtons = [...document.getElementsByName('humanCount')];

		this._addEventListeners();
	}
	
	_addEventListeners() {
		this.titleInput.addEventListener('input', this._checkSelected.bind(this));
		this.modeButtons.forEach((button) => {
			button.addEventListener('change', this._checkSelected.bind(this));
		});
		this.humanCountButtons.forEach((button) => {
			button.addEventListener('change', this._checkSelected.bind(this));
		});
	}

	_checkSelected() {
		const isSelectedTitle = this.titleInput.value !== "";
		const selectedModeButton = this.modeButtons.find((button) => button.checked);
		const isSelectedMode = selectedModeButton !== undefined;
		let isSelectedHumanCount = false;

		if (isSelectedMode) {
			if (selectedModeButton.value === "vampireVsHuman") {
				this.countSelection.classList.replace('invisibleSelectionGroup', 'visibleSelectionGroup');
				this.modeSelection.style.marginBottom = '8%';
				isSelectedHumanCount = this.humanCountButtons.find((button) => button.checked) !== undefined;
			} else {
				this.countSelection.classList.replace('visibleSelectionGroup', 'invisibleSelectionGroup');
				this.modeSelection.style.marginBottom = '0%';
				isSelectedHumanCount = true;
			}
		}

		console.log(isSelectedTitle, isSelectedMode, isSelectedHumanCount);
		if (isSelectedTitle && isSelectedMode && isSelectedHumanCount) {
			this.completeButtonEnabled = true;
			this.completeButton.classList.replace('disabledButton', 'activatedButton');
		} else {
			this.completeButtonEnabled = false;
			this.completeButton.classList.replace('activatedButton', 'disabledButton');
		}
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="roomSettingContainer">
				<div class="selectionGroup">${this._getTitleSelectionHTML()}</div>
				<div class="selectionGroup">${this._getModeSelectionHTML()}</div>
				<div class="selectionGroup invisibleSelectionGroup">
					${this._getPlayerCountSelectionHTML()}
				</div>
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