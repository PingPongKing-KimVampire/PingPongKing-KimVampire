import WaitingRoom from "../PingpongPage/WaitingRoom.js";

import SERVER_ADDRESS from "./../PageRouter.js";
import SERVER_PORT from "./../PageRouter.js";

class LobbyPageManager {
  constructor(app, clientInfo, onEnterSuccess, onEnterNewLobby) {
    console.log("Lobby Page!");
    app.innerHTML = this._getHTML();
    this.clientInfo = clientInfo;
    this.onEnterSuccess = onEnterSuccess;
    this.onEnterNewLobby = onEnterNewLobby;

    this._setCreateWaitingRoomButton();
    this._setEnterWaitingRoomButton();
    this._setSearchWaitingRoomListButton();
    this.clientInfo.socket.addEventListener("message", this.listener);

    const enterNewLobbyButton = document.querySelector(".enterNewLobbyButton");
    enterNewLobbyButton.addEventListener("click", () => {
      this.onEnterNewLobby();
      this.clientInfo.socket.removeEventListener("message", this.listener);
    });

    // this.lobbySocket = new WebSocket(
    //   `ws://${SERVER_ADDRESS}:${SERVER_PORT}/ws/lobby`
    // );

    // await new Promise((resolve) => {
    //   this.lobbySocket.addEventListener("open", () => {
    //     resolve();
    //   });
    // });
  }

  _setCreateWaitingRoomButton() {
    const modeSelect = document.getElementById("modeSelect");
    const totalPlayerCountDiv = document.getElementById("totalPlayerCountDiv");

    modeSelect.addEventListener("change", function () {
      if (modeSelect.value === "vampire") {
        totalPlayerCountDiv.style.display = "block";
      } else {
        totalPlayerCountDiv.style.display = "none";
      }
    });

    const createWaitingRoomButton = document.querySelector(
      ".createWaitingRoomButton"
    );
    createWaitingRoomButton.addEventListener("click", () => {
      const mode = modeSelect.value;
      let totalPlayerCount;
      if (mode === "normal") {
        totalPlayerCount = 2;
      }
      if (mode === "vampire") {
        totalPlayerCount = parseInt(
          document.getElementById("totalPlayerCount").value
        );
        if (isNaN(totalPlayerCount)) {
          alert(`참여인원${totalPlayerCount}가 유효하지 않습니다.`);
          return;
        }
        if (totalPlayerCount < 2 || totalPlayerCount > 6) {
          alert("참여인원 수는 2~6명이어야 합니다.");
          return;
        }
      }

      const createMessage = {
        sender: "client",
        receiver: ["server"],
        event: "createWaitingRoom",
        content: {
          clientId: `${this.clientInfo.id}`,
          gameInfo: {
            mode,
            totalPlayerCount,
          },
        },
      };
      this.clientInfo.socket.send(JSON.stringify(createMessage));
    });
  }

  _setEnterWaitingRoomButton() {
    const enterWaitingRoomButton = document.querySelector(
      ".enterWaitingRoomButton"
    );
    enterWaitingRoomButton.addEventListener("click", () => {
      const roomIdInput = document.querySelector("#roomIdInput");
      this._enterWaitingRoom(roomIdInput.value);
    });
  }

  _setSearchWaitingRoomListButton() {
    // 탁구장 조회
    const getWaitingRoomListButoon = document.querySelector(
      ".getWaitingRoomListButoon"
    );
    getWaitingRoomListButoon.addEventListener("click", () => {
      const getWaitingRoomLisMessage = {
        sender: "client",
        receiver: ["server"],
        event: "getWaitingRoomList",
        content: {},
      };
      this.clientInfo.socket.send(JSON.stringify(getWaitingRoomLisMessage));
    });
  }

  listener = (messageEvent) => {
    const message = JSON.parse(messageEvent.data);
    const { sender, receiver, event, content } = message;

    if (receiver.includes("client")) {
      if (event === "appointWaitingRoom") {
        // 대기실 임명 응답
        this.clientInfo.roomId = content.roomId;
        const gameInfo = content.gameInfo;
        new WaitingRoom(this.clientInfo, gameInfo);
        this._enterWaitingRoom(this.clientInfo.roomId);
      } else if (event === "enterWaitingRoomResponse") {
        // 대기실 입장 응답
        const gameInfo = content.gameInfo;
        this.onEnterSuccess(content.roomId, gameInfo);
        this.clientInfo.socket.removeEventListener("message", this.listener);
      } else if (event === "getWaitingRoomResponse") {
        // 대기실 조회 응답
        console.log(message);
        console.log(content);
        console.log(content.gameInfoList[0]);
        if (content.gameInfoList.length > 0) {
          const roomIdInput = document.querySelector("#roomIdInput");
          roomIdInput.value = content.gameInfoList.pop().roomId;
        }
      }
    }
  };

  _enterWaitingRoom(roomId) {
    const enterMessage = {
      sender: "client",
      receiver: ["waitingRoom"],
      event: "enterWaitingRoom",
      content: {
        roomId,
        clientId: this.clientInfo.id,
        clientNickname: this.clientInfo.nickname,
      },
    };
    this.clientInfo.socket.send(JSON.stringify(enterMessage));
  }

  _getHTML() {
    return `
			<label for="modeSelect">모드 선택:</label>
			<select id="modeSelect">
				<option value="normal">일반 모드</option>
				<option value="vampire">뱀파이어 모드</option>
			</select>
			
			<div id="totalPlayerCountDiv" style="display:none;">
				<label for="totalPlayerCount">참여인원 수 (2-6명):</label>
				<input type="number" id="totalPlayerCount" min="2" max="6">
			</div>
			<button class="createWaitingRoomButton">대기실 생성</button>
			<input type="text" id="roomIdInput">
			<button class="enterWaitingRoomButton">대기실 입장</button>
			<button class="getWaitingRoomListButoon">대기실 조회</button>
      <button class="enterNewLobbyButton">뉴 로비 입장</button>
		`;
  }
}

export default LobbyPageManager;
