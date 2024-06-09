import Player from "./Player.js";
import GameObjectRenderer from "./GameObjectRenderer.js";

class GamePageManager {
  constructor(app, clientInfo) {
    this.clientInfo = clientInfo;
    this.playerList = [];
    this.leftPlayer = { clientId: null, clientNickname: null };
    this.rightPlayer = { clientId: null, clientNickname: null };
    this.gameInfo = { // TODO : sizeInfo로 이름을 바꾸면 어떨까?
      boardWidth: null,
      boardHeight: null,
      paddleWidth: null,
      paddleHeight: null,
      ballRadius: null,
    };

    app.innerHTML = "WAIT START GAME";

    //게임정보 응답 받으면 시작
    this._getStartGameResponse(this.clientInfo.socket).then(() => {
      app.innerHTML = this.getHTML();
      // TODO : 게임 모드, 인원 전달하기
      this.gameObjectRenderer = new GameObjectRenderer(
        this.clientInfo,
        this.playerList,
        this.gameInfo,
        'vampire',
        3, // 임시 전달
      );

      this.player = new Player(this.clientInfo, this.playerList, this.gameInfo);
    });
  }

  //remove이벤트 리스너로 변경하기
  _getStartGameResponse(socket) {
    return new Promise((res, rej) => {
      socket.addEventListener("message", (eventMessage) => {
        const message = JSON.parse(eventMessage.data);
        const { sender, receiver, event, content } = message;
        // console.log("GAME START!!!!");
        // console.log(message);
        if (receiver.includes("player") && event === "startGame") {
          const { playerList, gameInfo } = content;
          this.playerList = playerList;
          this.gameInfo = gameInfo;
          this.leftPlayer = this.playerList.find(
            (player) => player.team === "left"
          );
          this.rightPlayer = this.playerList.find(
            (player) => player.team === "right"
          );
          res();
        }
      });
    });
  }

  getHTML() {
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

export default GamePageManager;
