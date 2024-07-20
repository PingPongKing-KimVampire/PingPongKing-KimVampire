import { SERVER_ADDRESS } from "./../PageRouter.js";
import { SERVER_PORT } from "./../PageRouter.js";

class WaitingRoomCreationPageManager {
	constructor(app, clientInfo, onEnterWaitingRoom, renderLobby) {
		console.log("Create Waiting Room Page!");
		app.innerHTML = this._getHTML();
		this.clientInfo = {
			socket: null,
			id: null,
			nickname: null,
			lobbySocket: null,
			gameInfo: {
				pingpongRoomSocket: null,
				roomId: null,
				title: null,
				teamLeftList: null,
				teamRightList: null,
				teamLeftMode: null,
				teamRightMode: null,
				teamLeftTotalPlayerCount: null,
				teamRightTotalPlayerCount: null,
			},
		};
		this.clientInfo = clientInfo;
		this.onEnterWaitingRoom = onEnterWaitingRoom;
		this.renderLobby = renderLobby;

		this.titleInput = document.querySelector("#titleInput");
		this.modeSelection = document.querySelector(".selectionContainer:nth-of-type(2)");
		this.modeButtons = [...document.getElementsByName("mode")];
		this.countSelection = document.querySelector(".selectionContainer:last-of-type");
		this.humanCountButton = document.querySelector("#humanCountBox");
		this.humanCountButtonText = this.humanCountButton ? this.humanCountButton.querySelector("div") : null;
		this.humanCountArrowImg = this.humanCountButton ? this.humanCountButton.querySelector("img") : null;
		this.humanCountOptionBox = document.querySelector("#humanCountBox:last-of-type");
		this.humanCountOptionButtons = [...document.getElementsByClassName("humanCountOptionButton")];
		this.completeButton = document.querySelector("#completeButton");
		this.completeButton.disabled = true;

		this._setTitleModeSelection();
		this._setHumanCountSelection();
		this._setCompleteButtonSelection();
		this._setExitButton();
	}

	_setTitleModeSelection() {
		// 방 제목 or 모드 입력이 변경될 때마다 _checkSelectedAll 호출
		if (this.titleInput) {
			this.titleInput.addEventListener("input", this._checkSelectedAll.bind(this));
		}
		if (this.modeButtons.length > 0) {
			this.modeButtons.forEach(button => {
				button.addEventListener("change", this._checkSelectedAll.bind(this));
			});
		}
	}

	_setHumanCountSelection() {
		// humanCount 버튼 or humanCountOption 버튼 클릭 시 반응
		if (this.humanCountButton) {
			this.humanCountButton.addEventListener("click", this._humanCountButtonClicked.bind(this));
		}
		if (this.humanCountOptionButtons.length > 0) {
			this.humanCountOptionButtons.forEach(button => {
				button.addEventListener("click", this._humanCountOptionButtonClicked.bind(this));
			});
		}
	}

	_setCompleteButtonSelection() {
		// complete 버튼 클릭 시 대기실 생성 메시지 전송
		this.completeButton.addEventListener("click", this._createAndEnterRoom.bind(this));
	}

	_setExitButton() {
		document.querySelector(".exitButton").addEventListener("click", () => {
			this.renderLobby();
		});
	}

	_checkSelectedAll() {
		// 모두 선택되었는지 확인하고 complete 버튼 활성화 or 비활성화
		const isSelectedTitle = this.titleInput.value !== "";
		const selectedModeButton = this.modeButtons.find(button => button.checked);
		const isSelectedMode = selectedModeButton !== undefined;
		if (isSelectedMode) {
			if (selectedModeButton.value === "vampireVsHuman") {
				this.countSelection.classList.replace("invisible", "visible");
				this.modeSelection.classList.add("selectionGroupBottomMargin");
			} else {
				this.countSelection.classList.replace("visible", "invisible");
				this.modeSelection.classList.remove("selectionGroupBottomMargin");
			}
		}
		if (isSelectedTitle && isSelectedMode) {
			this.completeButton.disabled = false;
			this.completeButton.classList.replace("disabledButton", "activatedButton");
		} else {
			this.completeButton.disabled = true;
			this.completeButton.classList.replace("activatedButton", "disabledButton");
		}
	}

	_humanCountButtonClicked() {
		if (this.humanCountArrowImg && this.humanCountOptionBox) {
			this.humanCountArrowImg.classList.toggle("nonSelectedArrowImg");
			this.humanCountArrowImg.classList.toggle("selectedArrowImg");
			this.humanCountOptionBox.classList.toggle("visible");
			this.humanCountOptionBox.classList.toggle("invisible");
		}
	}

	_humanCountOptionButtonClicked(event) {
		this._humanCountButtonClicked();
		const clickedValue = event.target.value;
		if (this.humanCountButton && this.humanCountButtonText) {
			this.humanCountButton.value = clickedValue;
			this.humanCountButtonText.innerText = `${clickedValue}명`;
		}
		// const clickedValue = event.target.value;
		// this.humanCountButton.value = clickedValue;
		// this.humanCountButtonText.innerText = `${clickedValue}명`;
		// let count = 2;
		for (const button of this.humanCountOptionButtons) {
			if (count === parseInt(clickedValue)) count++;
			button.innerText = `${count}명`;
			button.value = count;
			count++;
		}
	}

	async _createAndEnterRoom() {
		const title = this.titleInput.value;
		const mode = this.modeButtons.find(button => button.checked).value;
		let leftMode;
		let leftPlayerCount;
		let rightMode;
		let rightPlayerCount;

		if (mode === "humanVsHuman") {
			leftMode = "human";
			rightMode = "human";
			leftPlayerCount = 1;
			rightPlayerCount = 1;
		} else if (mode === "vampireVsVampire") {
			leftMode = "vampire";
			rightMode = "vampire";
			leftPlayerCount = 1;
			rightPlayerCount = 1;
		} else if (mode === "vampireVsHuman") {
			const humanCount = parseInt(this.humanCountButton.value);
			if (isNaN(humanCount)) return;
			leftMode = "vampire";
			rightMode = "human";
			leftPlayerCount = 1;
			rightPlayerCount = humanCount;
		}

		this._sendCreateRoomMsg(title, leftMode, leftPlayerCount, rightMode, rightPlayerCount);
		const roomId = await this._handleCreateRoomResponse(title, leftMode, leftPlayerCount, rightMode, rightPlayerCount);
		await this._enterWaitingRoom(roomId, title, leftMode, rightMode, leftPlayerCount, rightPlayerCount);
	}

	async _enterWaitingRoom(roomId, gameTitle, teamLeftMode, teamRightMode, teamLeftTotalPlayerCount, teamRightTotalPlayerCount) {
		const pingpongRoomSocket = new WebSocket(`ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/pingpong-room/${roomId}`, ['authorization', this.clientInfo.accessToken]);

		await new Promise(resolve => {
			pingpongRoomSocket.addEventListener("open", () => {
				resolve();
			});
		});

		const enterWaitingRoomMessage = {
			event: "enterWaitingRoom",
			content: {
				clientId: this.clientInfo.id,
			},
		};
		pingpongRoomSocket.send(JSON.stringify(enterWaitingRoomMessage));

		const { teamLeftList, teamRightList } = await new Promise(resolve => {
			pingpongRoomSocket.addEventListener(
				"message",
				function listener(messageEvent) {
					const { event, content } = JSON.parse(messageEvent.data);
					if (event === "enterWaitingRoomResponse") {
						pingpongRoomSocket.removeEventListener("message", listener);
						resolve(content);
					}
				}.bind(this),
			);
		});

		const gameInfo = {
			pingpongRoomSocket,
			roomId,
			title: gameTitle,
			teamLeftList,
			teamRightList,
			teamLeftMode,
			teamRightMode,
			teamLeftTotalPlayerCount,
			teamRightTotalPlayerCount,
		};
		this.clientInfo.gameInfo = gameInfo;
		this.clientInfo.lobbySocket.close();
		this.clientInfo.lobbySocket = null;

		this.onEnterWaitingRoom();
	}

	_sendCreateRoomMsg(title, leftMode, leftPlayerCount, rightMode, rightPlayerCount) {
		const createRoomMessage = {
			event: "createWaitingRoom",
			content: {
				waitingRoomInfo: {
					title,
					leftMode,
					leftPlayerCount,
					rightMode,
					rightPlayerCount,
				},
			},
		};
		this.clientInfo.lobbySocket.send(JSON.stringify(createRoomMessage));
	}
	_handleCreateRoomResponse() {
		return new Promise(resolve => {
			const listener = messageEvent => {
				const message = JSON.parse(messageEvent.data);
				const { event, content } = message;

				if (event === "createWaitingRoomResponse") {
					if (content.message === "OK") {
						this.clientInfo.socket.removeEventListener("message", listener);
						resolve(content.roomId);
					}
				}
			};
			this.clientInfo.lobbySocket.addEventListener("message", listener);
		});
	}

	_getHTML() {
		return `
			<button class="exitButton"></button>
			<div id="container">
				<div class="selectionContainer marginBottom">
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

	_getPlayerCountSelectionHTML() {
		return `
			<label class="label">인원</label>
			<div class="selectionBox">
				<div class="countBox">
					<div class="teamText">뱀파이어</div>
					<div id="vampireCountBox">1명</div>
				</div>
				<div id="vsText">VS</div>
				<div class="countBox">
					<div class="teamText">인간</div>
					<div id="humanCountBox" data-count="3">
						<div>3명</div>
						<img src="images/arrowImg.png" class="nonSelectedArrowImg">
						<ul id="humanCountOptionBox" class="invisible">
							<li><button class="humanCountOptionButton" value="2">2명</button></li>
							<li><button class="humanCountOptionButton" value="4">4명</button></li>
							<li><button class="humanCountOptionButton" value="5">5명</button></li>
						</ul>
					</div>
				</div>
			</div>
		`;
	}
}

export default WaitingRoomCreationPageManager;
