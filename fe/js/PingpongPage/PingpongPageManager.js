import Player from "./Player.js";
import PingpongRenderer from "./PingpongRenderer.js";

class PingpongPageManager {
  constructor(app, clientInfo, gameInfo) {
    this.clientInfo = clientInfo;
    this.gameInfo = gameInfo;
    this.playerList = [];
    this.leftPlayer = { clientId: null, clientNickname: null };
    this.rightPlayer = { clientId: null, clientNickname: null };
    this.sizeInfo = null;

    app.innerHTML = "WAIT START GAME";

    //게임시작 메시지 받으면 시작
    this._getStartGameResponse(this.clientInfo.socket).then(() => {
      app.innerHTML = this._getPingpongHTML();

      this.gameObjectRenderer = new PingpongRenderer(
        this.clientInfo,
        this.playerList,
        this.sizeInfo,
        this.gameInfo
      );

      this.player = new Player(this.clientInfo, this.playerList, this.sizeInfo);
    });
  }

  _getStartGameResponse(socket) {
    return new Promise((res, rej) => {
      const listener = (messageEvent) => {
        const message = JSON.parse(messageEvent.data);
        const { sender, receiver, event, content } = message;
        if (receiver.includes("player") && event === "startGame") {
          socket.removeEventListener("message", listener);
          const { playerList, sizeInfo } = content;
          this.sizeInfo = sizeInfo;
          this.playerList = playerList;
          this.leftPlayer = this.playerList.find(
            (player) => player.team === "left"
          );
          this.rightPlayer = this.playerList.find(
            (player) => player.team === "right"
          );
          res();
        }
      };

      socket.addEventListener("message", listener);
    });
  }

  _getPingpongHTML() {
    return `
			<div id="gameContainer">
				${this._getDisplayBoardHTML()}
				${this._getPlayBoardHTML()}
			</div>
			${this._getExitModalHTML()}
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

  _getExitModalHTML() {
    return `
			<button class="exitButton"></button>
			<div class="exitModal">
				<div class="questionBox">
					<div class="question">상대에게 승리를 선사하시겠습니까?</div>
					<div class="buttonGroup">
						<button class="yesButton">네</button>
						<button class="noButton">아니오</button>
					</div>
				</div>
			</div>
		`;
  }
}

export default PingpongPageManager;
