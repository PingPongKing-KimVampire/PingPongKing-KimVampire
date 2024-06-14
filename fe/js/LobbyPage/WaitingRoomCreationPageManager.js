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
		this.humanCountButton = document.querySelector('#humanCountButton');
		this.humanCountButtonText = document.querySelector('#humanCountButton div');
		this.humanCountArrowImg = document.querySelector('#humanCountButton img');
		this.humanCountOptionBox = document.querySelector('#humanCountOptionBox');
		this.humanCountOptionButtons = [...document.getElementsByClassName('humanCountOptionButton')];

		this._addEventListeners();
	}
	
	_addEventListeners() {
		this.titleInput.addEventListener('input', this._checkSelected.bind(this));
		this.modeButtons.forEach((button) => {
			button.addEventListener('change', this._checkSelected.bind(this));
		});
		this.humanCountButton.addEventListener('click', this._humanCountButtonClicked.bind(this));
		this.humanCountOptionButtons.forEach((button) => {
			button.addEventListener('click', this._humanCountOptionButtonClicked.bind(this))
		})
	}

	_humanCountButtonClicked() {
		this.humanCountArrowImg.classList.toggle('selectedArrowImg');
		this.humanCountOptionBox.classList.toggle('visible');
		this.humanCountOptionBox.classList.toggle('invisible');
	}

	_humanCountOptionButtonClicked(event) {
		this._humanCountButtonClicked();
		
		const clickedValue = event.target.value;
		this.humanCountButton.value = clickedValue;
		this.humanCountButtonText.innerText = `${clickedValue}명`;

		let count = 2;
		for (const button of this.humanCountOptionButtons) {
			if (count === parseInt(clickedValue)) count++;
			button.innerText = `${count}명`;
			button.value = count;
			count++;
		}
	}

	_checkSelected() {
		const isSelectedTitle = this.titleInput.value !== "";
		const selectedModeButton = this.modeButtons.find((button) => button.checked);
		const isSelectedMode = selectedModeButton !== undefined;

		if (isSelectedMode) {
			if (selectedModeButton.value === 'vampireVsHuman') {
				this.countSelection.classList.replace('invisible', 'visible');
				this.modeSelection.classList.add('selectionGroupBottomMargin');
			} else {
				this.countSelection.classList.replace('visible', 'invisible');
				this.modeSelection.classList.remove('selectionGroupBottomMargin');
			}
		}

		if (isSelectedTitle && isSelectedMode) {
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
				<div class="selectionGroup selectionGroupBottomMargin">
					${this._getTitleSelectionHTML()}
				</div>
				<div class="selectionGroup">
					${this._getModeSelectionHTML()}
				</div>
				<div class="selectionGroup invisible">
					${this._getPlayerCountSelectionHTML()}
				</div>
				<button id="completeButton" class="disabledButton">방 생성하기</button>
			</div>
		`;
	}

	_getTitleSelectionHTML() {
		return `
			<label class="selectionLabel" for="titleInput">방 제목</label>
			<div class="selectionBox">
				<input type="text" id="titleInput">
			</div>
		`;
	}

	_getModeSelectionHTML() {
		return `
			<label class="selectionLabel">모드</label>
			<div class="selectionBox">
				<input type="radio" name="mode" id="humanVsHuman" value="humanVsHuman">
				<label for=humanVsHuman class="modeButton">인간 VS 인간</label>
				<input type="radio" name="mode" id="vampireVsVampire" value="vampireVsVampire">
				<label for=vampireVsVampire class="modeButton">뱀파이어 VS 뱀파이어</label>
				<input type="radio" name="mode" id="vampireVsHuman" value="vampireVsHuman">
				<label for=vampireVsHuman class="modeButton">뱀파이어 VS 인간</label>
			</div>
		`;
	}

	_getPlayerCountSelectionHTML() {
		return `
			<label class="selectionLabel">인원</label>
			<div class="selectionBox">
				<div class="countSelectionBox">
					<div class="teamText">뱀파이어</div>
					<button id="vampireCountButton">3명</button>
				</div>
				<div id="vsText">VS</div>
				<div class="countSelectionBox">
					<div class="teamText">인간</div>
					<button id="humanCountButton" value="3">
						<div>3명</div>
						<img src="images/arrowImg.png">
					</button>
				</div>
				<ul id="humanCountOptionBox" class="invisible">
					<li><button class="humanCountOptionButton" value="2">2명</button></li>
					<li><button class="humanCountOptionButton" value="4">4명</button></li>
					<li><button class="humanCountOptionButton" value="5">5명</button></li>
					<li><button class="humanCountOptionButton" value="6">6명</button></li>
				</ul>
			</div>
		`;
	}

}

export default WaitingRoomCreationPageManager;