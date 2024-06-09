import windowObservable from "../../WindowObservable.js";

class GameObjectRenderer {
  constructor(clientInfo, playerList, gameInfo, gameMode, personnel) {
    this._initGaneObjectRenderer(clientInfo, playerList, gameInfo);
    this._setDisplayBoard(gameMode, personnel);
    this._manageMessageEvent();
    this._subscribeWindow();
    this._updateGameContainer();
  }

  _initGaneObjectRenderer(clientInfo, playerList, gameInfo) {
    this.clientInfo = clientInfo;
    this.players = [];
    this.me = null;

    this.ball = {
      element: document.querySelector(".ball"),
      xPos: 50,
      yPos: 50,
    };

    this._setGameSizeInfo(gameInfo);
    this._setPlayers(playerList);
    this.gameContainer = document.querySelector("#gameContainer");
    this.VCPercent = 90;
    this.orientation = windowObservable.getOrientation();
    this.leftScore = document.querySelector("#leftDisplayBoard .playerScore");
    this.rightScore = document.querySelector("#rightDisplayBoard .playerScore");
    this.leftBoard = document.querySelector(".subPlayBoard:nth-of-type(1)");
    this.rightBoard = document.querySelector(".subPlayBoard:nth-of-type(2)");
  }

  _setDisplayBoard(gameMode, personnel) {
    this._setDisplayName(gameMode);
    this._setDisplayAvatar(gameMode, personnel);
  }
  _setDisplayName(gameMode) {
    const leftName = document.querySelector("#leftDisplayBoard .playerName");
    const rightName = document.querySelector('#rightDisplayBoard .playerName');

    let myTeamName, oppnentTeamName;
    if (gameMode === 'vampire') {
      const ImVampire = this.me.team === 'left';
      myTeamName = ImVampire ? '뱀파이어' : '인간';
      oppnentTeamName = ImVampire ? '인간' : '뱀파이어';
    } else if (gameMode === 'normal') {
      console.log(this.me.nickName, this.players.find((player) => player !== this.me).nickName);
      myTeamName = this.me.nickName;
      oppnentTeamName = this.players.find((player) => player !== this.me).nickName;
    }

    leftName.innerText = oppnentTeamName;
    rightName.innerText = myTeamName;
  }
  _setDisplayAvatar(gameMode, personnel) {
    const leftAvatar = document.querySelector('#leftDisplayBoard .playerAvatar');
    const rightAvatar = document.querySelector('#rightDisplayBoard .playerAvatar');

    const appendImage = (avatar, src, count = 1) => {
      for (let i = 0; i < count; i++) {
        const img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = `${100 / count}%`;
        avatar.appendChild(img);
      }
    }
    
    if (gameMode === 'vampire') {
      const ImVampire = this.me.team === 'left';
      const vampireAvatar = ImVampire ? rightAvatar : leftAvatar;
      const humanAvatar = ImVampire ? leftAvatar : rightAvatar;
      appendImage(vampireAvatar, 'images/playerA.png');
      appendImage(humanAvatar, 'images/playerB.png', personnel - 1);
    } else if (gameMode === 'normal') {
      appendImage(leftAvatar, 'images/playerA.png');
      appendImage(rightAvatar, 'images/playerB.png');
    }
  }

  _subscribeWindow() {
    windowObservable.subscribeResize(this._updateGameContainer.bind(this));
    windowObservable.subscribeOrientationChange(
      this._updateOrientation.bind(this)
    );
  }

  _manageMessageEvent() {
    this.clientInfo.socket.addEventListener('message', (messageEvent) => {
      const message = JSON.parse(messageEvent.data);
      const { sender, receiver, event, content } = message;
      // TODO : 혹시 roomId도 확인해야 하나?
      if (receiver.includes('player')) {
        if (event === 'updatePaddleLocation') { // 패들 위치 변경
          this._updatePaddle(content);
          this._renderPaddle(content);
        } else if (event === 'updateBallLocation') { // 공 위치 변경
          this._updateBall(content);
          this._renderBall(content);
        } else if (event === 'updateScore') { // 점수 변경
          this._updateScore(content);
        } else if (event === 'winGame') { // 게임 승리
          this._winGame(content);
        }
      }
    });
  }

  _setGameSizeInfo(gameInfo) {
    this.boardWidth = gameInfo.boardWidth;
    this.boardHeight = gameInfo.boardHeight;
    this.gameContainerRatio = this.boardWidth / this.boardHeight;
    this.paddleHeightPercent = (gameInfo.paddleHeight / this.boardHeight) * 100;
    this.paddleWidthPercent = (gameInfo.paddleWidth / this.boardWidth) * 100;
    this.ballSizePercent = ((gameInfo.ballRadius * 2) / this.boardWidth) * 100;
  }

  _setPlayers(playerList) {
    const board = document.querySelector("#playBoard");
    for (const { clientId, clientNickname, team } of playerList) {
      const player = {
        id: clientId,
        nickName: clientNickname,
        team: team,
        paddle: {
          element: this._createPaddle(board), // 패들 생성하기
          xPos: 0,
          yPos: 0,
        },
      };
      this.players.push(player);
      if (clientId === this.clientInfo.id) this.me = player;
    }
  }

  _createPaddle(board) {
    const paddle = document.createElement("div");
    paddle.classList.add("paddle");
    board.appendChild(paddle);
    return paddle;
  }

  _updateOrientation(orientation) {
    this.orientation = orientation;
    this._updateGameContainer();
    this._renderBall({ xPosition: this.ball.xPos, yPosition: this.ball.yPos });
    this.players.forEach((player) =>
      this._renderPaddle({ clientId: player.id, xPosition: player.paddle.xPos, yPosition: player.paddle.yPos })
    )
  }

  _updatePaddle({ clientId, xPosition, yPosition }) {
    const player = this.players.find((player) => player.id === clientId);
    player.paddle.xPos = xPosition;
    player.paddle.yPos = yPosition;
  }

  _updateBall({ xPosition, yPosition }) {
    this.ball.xPos = xPosition;
    this.ball.yPos = yPosition;
  }

  _renderBall({ xPosition, yPosition }) {
    if (this.orientation === "portrait") {
      this.ball.element.style.height = `${this.ballSizePercent}%`;
      this.ball.element.style.width = "auto";
    } else if (this.orientation === "landscape") {
      this.ball.element.style.width = `${this.ballSizePercent}%`;
      this.ball.element.style.height = "auto";
    }
    this.ball.element.style.aspectRatio = "1/1";

    const yPercent = (yPosition / this.boardHeight) * 100;
    const xPercent = (xPosition / this.boardWidth) * 100;
    if (this.orientation === "portrait") {
      this.ball.element.style.top =
        this.me.team === "right" ? `${xPercent}%` : `${100 - xPercent}%`;
      this.ball.element.style.left = `${100 - yPercent}%`;
    } else if (this.orientation === "landscape") {
      this.ball.element.style.top = `${yPercent}%`;
      this.ball.element.style.left =
        this.me.team === "right" ? `${xPercent}%` : `${100 - xPercent}%`;
    }
    this.ball.element.style.transform = `translate(-50%, -50%)`;
  }

  _renderPaddle({ clientId, xPosition, yPosition }) {
    const yPercent = (yPosition / this.boardHeight) * 100;
    const xPercent = (xPosition / this.boardWidth) * 100;

    const player = this.players.find((player) => player.id === clientId);

    // TODO : paddle의 height, width를 매번 재설정해 줄 필요가 있을까?
    player.paddle.element.style.color = "blue";
    if (this.orientation === "portrait") {
      player.paddle.element.style.height = `${this.paddleWidthPercent}%`;
      player.paddle.element.style.width = `${this.paddleHeightPercent}%`;
      player.paddle.element.style.top =
        this.me.team === "right" ? `${xPercent}%` : `${100 - xPercent}%`;
      player.paddle.element.style.left = `${100 - yPercent}%`;
    } else if (this.orientation === "landscape") {
      player.paddle.element.style.height = `${this.paddleHeightPercent}%`;
      player.paddle.element.style.width = `${this.paddleWidthPercent}%`;
      player.paddle.element.style.top = `${yPercent}%`;
      player.paddle.element.style.left =
        this.me.team === "right" ? `${xPercent}%` : `${100 - xPercent}%`;
    }
    player.paddle.element.style.transform = `translate(-50%, -50%)`;
  }

  _updateScore({ team, score }) {
    const updatedHTML = `${score}<div class="playerScoreStroke">${score}</div>`;
    if (team === this.me.team) {
      this.rightScore.innerHTML = updatedHTML;
    } else {
      this.leftScore.innerHTML = updatedHTML;
    }
  }

  _winGame({ team }) {
    const board = team === "left" ? this.leftBoard : this.rightBoard;
    board.style.backgroundColor = "red";
  }

  _updateGameContainer() {
    const ratio = this.gameContainerRatio;
    if (this.orientation === "portrait") {
      // 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
      if (window.innerHeight / window.innerWidth < ratio) {
        this.gameContainer.style.height = `${this.VCPercent}vh`;
        this.gameContainer.style.width = `${this.VCPercent / ratio}vh`;
      } else {
        // 뷰포트 높이가 충분함 -> 뷰포트 너비 기준
        this.gameContainer.style.width = `${this.VCPercent}vw`;
        this.gameContainer.style.height = `${this.VCPercent * ratio}vw`;
      }
    } else if (this.orientation === "landscape") {
      // 뷰포트 너비가 높이에 비해 일정 수준 이상 작아짐 -> 뷰포트 너비 기준
      if (window.innerWidth / window.innerHeight < ratio) {
        this.gameContainer.style.width = `${this.VCPercent}vw`;
        this.gameContainer.style.height = `${this.VCPercent / ratio}vw`;
      } else {
        // 뷰포트 너비가 충분함 -> 뷰포트 높이 기준
        this.gameContainer.style.height = `${this.VCPercent}vh`;
        this.gameContainer.style.width = `${this.VCPercent * ratio}vh`;
      }
    }
  }
}

export default GameObjectRenderer;