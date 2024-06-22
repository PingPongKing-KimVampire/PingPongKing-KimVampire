import Player from "./Player.js";
import PingpongRenderer from "./PingpongRenderer.js";

class PingpongPageManager {
  constructor(app, clientInfo, onExitPingpong) {
    this.app = app;
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
        sizeInfo: {
          boardWidth: null,
          boardHeight: null,
          paddleWidth: null,
          paddleHeight: null,
          ballRadius: null,
        },
      },
    };
    this.clientInfo = clientInfo;
    this.onExitPingpong = onExitPingpong;
    this.playerList = [];
  }

  async initPage() {
    //추후 API에 추가해야함
    //게임 사이즈관련 정보가 API에 없다.
    this.clientInfo.gameInfo.sizeInfo = {
      boardWidth: 1300,
      boardHeight: 1000,
      paddleWidth: 50,
      paddleHeight: 200,
      ballRadius: 25,
    };
    this.app.innerHTML = this._getPingpongHTML();

    this.pingpongRenderer = new PingpongRenderer(this.clientInfo);
    this.player = new Player(this.clientInfo, this.playerList, this.sizeInfo);

    this._manageExitRoom(); // 탁구장 나가기 처리
    this.exitPingpongPageRef = this._exitPingpongPage.bind(this);
    this.clientInfo.socket.addEventListener("close", this.exitPingpongPageRef); // 탁구장 폐쇄 감지
  }

  _manageExitRoom() {
    const exitButton = document.querySelector(".exitButton");
    const exitYesButton = document.querySelector(
      ".questionModal .activatedButton:nth-of-type(1)"
    );
    const exitNoButton = document.querySelector(
      ".questionModal .activatedButton:nth-of-type(2)"
    );
    const questionModal = document.querySelector(".questionModal");
    exitButton.addEventListener(
      "click",
      this._exitButtonClicked.bind(this, questionModal)
    );
    exitYesButton.addEventListener(
      "click",
      this._exitYesButtonClicked.bind(this)
    );
    exitNoButton.addEventListener(
      "click",
      this._exitNoButtonClicked.bind(this, questionModal)
    );
  }
  _exitButtonClicked(questionModal) {
    questionModal.style.display = "flex";
  }
  _exitYesButtonClicked() {
    this.clientInfo.socket.close();
    this._exitPingpongPage();
  }
  _exitNoButtonClicked(questionModal) {
    questionModal.style.display = "none";
  }

  _exitPingpongPage() {
    // PingpongPageManager, PingpongRenderer, Player에서 소켓과의 모든 상호작용 삭제
    this.clientInfo.socket.removeEventListener(
      "close",
      this.exitPingpongPageRef
    );
    this.pingpongRenderer.removeListener.call(this.pingpongRenderer);
    this.pingpongRenderer.unsubscribeWindow.call(this.pingpongRenderer);
    this.player.unsubscribeWindow.call(this.player);
    this.onExitPingpong();
    // window.getEventListeners(this.clientInfo.socket);
    // TODO : 남아있는 리스너 확인하기
  }

  _getPingpongHTML() {
    return `
			<div id="gameContainer">
				${this._getDisplayBoardHTML()}
				${this._getPlayBoardHTML()}
			</div>
			${this._getquestionModalHTML()}
		`;
  }

  _getDisplayBoardHTML() {
    return `
			<div id="displayBoard">
				<div id="leftDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">0<div class="playerScoreStroke">0</div></div>
					</div>
					<div class="playerAvatar"></div>
				</div>
				<div class="timeInfo">
					<div id="timeText">01 : 33</div>
				</div>
				<div id="rightDisplayBoard">
					<div class="playerInfo">
						<div class="playerName"></div>
						<div class="playerScore">0<div class="playerScoreStroke">0</div></div>
					</div>
					<div class="playerAvatar"></div>
				</div>
			</div>
		`;
  }

  _getPlayBoardHTML() {
    return `
			<div id="playBoard">
				<div class="subPlayBoard"></div>
				<div class="subPlayBoard"></div>
				<div class="ball"></div>
			</div>
		`;
  }

  _getquestionModalHTML() {
    return `
			<button class="exitButton"></button>
			<div class="questionModal">
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
}

export default PingpongPageManager;
