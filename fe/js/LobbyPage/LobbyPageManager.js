class LobbyPageManager {
  constructor(app) {
    console.log("Create Lobby Page!");
    app.innerHTML = this._getHTML();

    // 테스트용 대기실
    this._appendWaitingRoom();

    this._autoSetScollTrackColor();
    this._adjustButtonSize();

    window.addEventListener("resize", this._adjustButtonSize);
    window.addEventListener("resize", this._autoSetScollTrackColor);
    this._manageExitRoom();
  }

  _manageExitRoom() {
    const exitButton = document.querySelector('.exitButton');
    const exitYesButton = document.querySelector('.exitModal .activatedButton:nth-of-type(1)');
    const exitNoButton = document.querySelector('.exitModal .activatedButton:nth-of-type(2)');
    const exitModal = document.querySelector('.exitModal');
    exitButton.addEventListener('click', this._exitButtonClicked.bind(this, exitModal));
    exitYesButton.addEventListener('click', this._exitYesButtonClicked.bind(this));
    exitNoButton.addEventListener('click', this._exitNoButtonClicked.bind(this, exitModal));
}
_exitButtonClicked(exitModal) {
    exitModal.style.display = 'flex';
}
_exitYesButtonClicked() {
    const sendGiveUpMsg = () => {
        const giveUpMessage = {
            sender: "player",
            receiver: ["referee", "player"],
            event: "giveUpGame",
            content: {
                roomId: this.clientInfo.roomId,
                clientId: this.clientInfo.id,
            }
        }
        this.clientInfo.socket.send(JSON.stringify(giveUpMessage));
    }
    sendGiveUpMsg();
    this._exitPingpongPage();
}
_exitNoButtonClicked(exitModal) {
    exitModal.style.display = 'none';
}

  _getHTML() {
    return `
    <div class="lobby">
    <div class="lobbyInner">
        ${this._getWaitingRoomCreationButtonHtml()}
        ${this._getWaitingRoomListContainerHtml()}
    </div>
  </div>
  ${this._getExitModalHTML()}
  `;
  }

  _getWaitingRoomCreationButtonHtml() {
    return `<button class="createWatingRoombButton">탁구장 생성하기</button>`;
  }

  _getWaitingRoomListContainerHtml() {
    return `<div class="outerContainer">
    <div class="waitingRoomListContainer">

    </div>
  </div>
  `;
  }

  _adjustButtonSize() {
    const button = document.querySelector(".createWatingRoombButton");
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    if (viewWidth < viewHeight) {
      button.style.height = "4vh";
      button.style.width = "calc(4vh * 4 / 1)";
    } else {
      button.style.width = "16vw";
      button.style.height = "calc(16vw * 1 / 4)";
    }
  }

  _autoSetScollTrackColor() {
    let waitingRoomListContainer = document.querySelector(
      ".waitingRoomListContainer"
    );
    if (
      waitingRoomListContainer.scrollHeight >
      waitingRoomListContainer.clientHeight
    ) {
      waitingRoomListContainer.classList.remove("scrollbar-scrolltrack");
      waitingRoomListContainer.classList.add("transparent-scrolltrack");
    } else {
      waitingRoomListContainer.classList.add("scrollbar-scrolltrack");
      waitingRoomListContainer.classList.remove("transparent-scrolltrack");
    }
  }

  _getExitModalHTML() {
    return `
        <button class="exitButton"></button>
        <div class="exitModal">
            <div class="questionBox">
                <div class="question">상대에게 승리를 선사하시겠습니까?</div>
                <div class="buttonGroup">
                    <button class="activatedButton">네</button>
                    <button class="activatedButton">아니오</button>
                </div>
            </div>
        </div>
    `;
  }

  _appendWaitingRoom() {
    let waitingRoomListContainer = document.querySelector(
      ".waitingRoomListContainer"
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement("뱀파이어", "인간", "개쩌는 탁구장", 1, 6)
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement("뱀파이어", "인간", "개쩌는 탁구장", 2, 6)
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement("뱀파이어", "인간", "개쩌는 탁구장", 3, 6)
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement("인간", "인간", "겜제목", 4, 6)
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement("인간", "뱀파이어", "겜제목", 5, 6)
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement(
        "인간",
        "인간",
        "인간모드입니다 초보만 드루와",
        5,
        6
      )
    );
    waitingRoomListContainer.appendChild(
      this._getWaitingRoomelement(
        "인간",
        "인간",
        `      짱짱긴 제목입니다 짱짱길어서 진짜 짱짱김짱짱긴
      제목입니다짱짱길어서 진짜 짱짱김짱짱긴 제목입니다 짱짱길어서
      진짜짱짱김짱짱긴 제목입니다 짱짱길어서 진짜 짱짱김짱짱긴
      제목입니다짱짱길어서 진짜 짱짱김짱짱긴 제목입니다 짱짱길어서
      진짜`,
        5,
        6
      )
    );
  }

  _getWaitingRoomelement(
    team1,
    team2,
    gameTitle,
    currendPlayerCount,
    totalPlayerCount
  ) {
    const waitingRoomContainer = document.createElement("div");
    waitingRoomContainer.className = "waitingRoomContainer";

    const gameTypeContainer = document.createElement("div");
    gameTypeContainer.className = "gameTypeContainer";

    const teamName1 = document.createElement("span");
    teamName1.className = "teamName";
    teamName1.textContent = team1;

    const vsName = document.createElement("span");
    vsName.className = "vsName";
    vsName.textContent = "vs";

    const teamName2 = document.createElement("span");
    teamName2.className = "teamName";
    teamName2.textContent = team2;

    gameTypeContainer.appendChild(teamName1);
    gameTypeContainer.appendChild(vsName);
    gameTypeContainer.appendChild(teamName2);

    const matchName = document.createElement("div");
    matchName.className = "matchName";

    const gameName = document.createElement("div");
    gameName.className = "gameName";
    gameName.textContent = gameTitle;

    const matchPlayerCount = document.createElement("div");
    matchPlayerCount.className = "matchPlayerCount";
    matchPlayerCount.textContent = `${currendPlayerCount} / ${totalPlayerCount}`;

    waitingRoomContainer.appendChild(gameTypeContainer);
    waitingRoomContainer.appendChild(matchName);
    waitingRoomContainer.appendChild(gameName);
    waitingRoomContainer.appendChild(matchPlayerCount);
    return waitingRoomContainer;
  }
}

export default LobbyPageManager;
