import WaitingRoom from "../PingpongPage/WaitingRoom.js";

class WaitingRoomCreationPageManager {
	constructor(app, clientInfo, onEnterSuccess) {
		console.log("Create Waiting Room Page!");
		app.innerHTML = this._getHTML();
		this.clientInfo = clientInfo;
		this.onEnterSuccess = onEnterSuccess;

		// HTML 요소
		this.titleInput = document.querySelector('#titleInput');
		this.modeSelection = document.querySelector('.selectionContainer:nth-of-type(2)');
		this.modeButtons = [...document.getElementsByName('mode')];
		this.countSelection = document.querySelector('.selectionContainer:last-of-type');
		this.humanCountButton = document.querySelector('#humanCountButton');
		this.humanCountButtonText = document.querySelector('#humanCountButton div');
		this.humanCountArrowImg = document.querySelector('#humanCountButton img');
		this.humanCountOptionBox = document.querySelector('#humanCountOptionBox');
		this.humanCountOptionButtons = [...document.getElementsByClassName('humanCountOptionButton')];
		this.completeButton = document.querySelector('#completeButton');
		this.completeButton.disabled = true;

		this._setTitleModeSelection();
		this._setHumanCountSelection();
		this._setCompleteButtonSelection();
	}

	_setTitleModeSelection() {
		// 방 제목 or 모드 입력이 변경될 때마다 _checkSelectedAll 호출
		this.titleInput.addEventListener('input', this._checkSelectedAll.bind(this));
		this.modeButtons.forEach((button) => {
			button.addEventListener('change', this._checkSelectedAll.bind(this));
		});
	}

	_setHumanCountSelection() {
		// humanCount 버튼 or humanCountOption 버튼 클릭 시 반응
		this.humanCountButton.addEventListener('click', this._humanCountButtonClicked.bind(this));
		this.humanCountOptionButtons.forEach((button) => {
			button.addEventListener('click', this._humanCountOptionButtonClicked.bind(this))
		})
	}

	_setCompleteButtonSelection() {
		// complete 버튼 클릭 시 대기실 생성 메시지 전송
		this.completeButton.addEventListener('click', this._createAndEnterRoom.bind(this));
		// this.clientInfo.socket.addEventListener("message", this.listener);
	}

	_checkSelectedAll() {
		// 모두 선택되었는지 확인하고 complete 버튼 활성화 or 비활성화
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
			this.completeButton.disabled = false;
			this.completeButton.classList.replace('disabledButton', 'activatedButton');
		} else {
			this.completeButton.disabled = true;
			this.completeButton.classList.replace('activatedButton', 'disabledButton');
		}
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

	async _createAndEnterRoom() {
		const title = this.titleInput.value;
		// const mode = this.modeButtons.find((button) => button.checked).value;
		const mode = 'vampire'; // 임시 모드 하드 코딩
		const humanCount = this.humanCountButton.value;
		const totalPlayerCount = mode === 'vampireVsHuman' ? humanCount + 1 : 2;

		this._sendCreateRoomMsg(title, mode, totalPlayerCount);
		console.log(1);
		await this._handleCreateRoomResponse(title, mode, totalPlayerCount);
		console.log(2);
		this._sendEnterRoomMsg();
		console.log(3);
		await this._handleEnterRoomResponse();
		console.log(4);
	}

	_sendCreateRoomMsg(title, mode, totalPlayerCount) {
		const createRoomMessage = {
			sender: "client",
			receiver: ["server"],
			event: "createWaitingRoom",
			content: {
				clientId: `${this.clientInfo.id}`,
				waitingRoomInfo: {
					title,
					mode,
					totalPlayerCount,
				}
			}
		}
		this.clientInfo.socket.send(JSON.stringify(createRoomMessage));
	}
	_handleCreateRoomResponse(title, mode, totalPlayerCount) {
		return new Promise((resolve, reject) => {
			const listener = (messageEvent) => {
				const message = JSON.parse(messageEvent.data);
				const { sender, receiver, event, content } = message;
				if (receiver.includes('client') && event === 'appointWaitingRoom') {
					this.clientInfo.socket.removeEventListener('message', listener);
					this.clientInfo.roomId = content.roomId;
					const gameInfo = {
						title,
						mode,
						totalPlayerCount,
					}
					new WaitingRoom(this.clientInfo, gameInfo);
					resolve();
				}
			}
			this.clientInfo.socket.addEventListener('message', listener);
		})
	}
	_sendEnterRoomMsg() {
		const enterRoomMessage = {
			sender: "client",
			receiver: ["waitingRoom"],
			event: "enterWaitingRoom",
			content: {
				roomId: this.clientInfo.roomId,
				clientId: this.clientInfo.id,
				clientNickname: this.clientInfo.nickname,
			},
		}
		this.clientInfo.socket.send(JSON.stringify(enterRoomMessage));
	}
	_handleEnterRoomResponse() {
		return new Promise((resolve, reject) => {
			const listener = (messageEvent) => {
				const message = JSON.parse(messageEvent.data);
				const { sender, receiver, event, content } = message;
				if (receiver.includes('client') && event === 'enterWaitingRoomResponse') {
					this.clientInfo.socket.removeEventListener('message', listener);
					this.onEnterSuccess(content.roomId, content.gameInfo);
					resolve();
				}
			}
			this.clientInfo.socket.addEventListener('message', listener);
		})
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="roomSettingContainer">
				<div class="selectionContainer selectionGroupBottomMargin">
					${this._getTitleSelectionHTML()}
				</div>
				<div class="selectionContainer">
					${this._getModeSelectionHTML()}
				</div>
				<div class="selectionContainer invisible">
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

	// _getPlayerCountSelectionHTML() {
	// 	return `
	// 		<label class="selectionLabel">인원</label>
	// 		<div class="selectionBox">
	// 			<div class="countBox">
	// 				<div class="teamText">뱀파이어</div>
	// 				<button id="vampireCountButton">3명</button>
	// 			</div>
	// 			<div id="vsText">VS</div>
	// 			<div class="countBox">
	// 				<div class="teamText">인간</div>
	// 				<button id="humanCountButton" value="3">
	// 					<div>3명</div>
	// 					<img src="images/arrowImg.png">
	// 				</button>
	// 			</div>
	// 			<ul id="humanCountOptionBox" class="invisible">
	// 				<li><button class="humanCountOptionButton" value="2">2명</button></li>
	// 				<li><button class="humanCountOptionButton" value="4">4명</button></li>
	// 				<li><button class="humanCountOptionButton" value="5">5명</button></li>
	// 				<li><button class="humanCountOptionButton" value="6">6명</button></li>
	// 			</ul>
	// 		</div>
	// 	`;
	// }

	_getPlayerCountSelectionHTML() {
		return `
			<label class="selectionLabel">인원</label>
			<div class="selectionBox">
				<div class="countBox" id="vampireCountBox">
					<div class="teamText">뱀파이어</div>
					<button id="vampireCountButton">3명</button>
				</div>
				<div id="vsText">VS</div>
				<div id="humanCountSelectionBox">
					<div class="countBox" id="humanCountBox">
						<div class="teamText">인간</div>
						<button id="humanCountButton" value="3">
							<div>3명</div>
							<img src="images/arrowImg.png">
						</button>
					</div>
					<div class="countBox" id="humanCountBox">
						<div class="teamText"></div>
						<ul id="humanCountOptionBox" class="invisible">
							<li><button class="humanCountOptionButton" value="2">2명</button></li>
							<li><button class="humanCountOptionButton" value="4">4명</button></li>
							<li><button class="humanCountOptionButton" value="5">5명</button></li>
							<li><button class="humanCountOptionButton" value="6">6명</button></li>
						</ul>
					</div>
				</div>
			</div>
		`;
	}

}

export default WaitingRoomCreationPageManager;