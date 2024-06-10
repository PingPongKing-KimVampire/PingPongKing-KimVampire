import Referee from "./Referee.js";

class WaitingRoom {
  constructor(clientInfo, gameInfo) {
    this.clientInfo = clientInfo;
    this.gameInfo = {
      mode: null,
      totalPlayerCount: null,
    };
    this.gameInfo = gameInfo;

    this.players = [];
    this.clientInfo.socket.addEventListener("message", this.listener);
  }

  listener = (messageEvent) => {
    const message = JSON.parse(messageEvent.data);
    const { sender, receiver, event, content } = message;

    if (receiver.includes("waitingRoom")) {
      if (event === "enterWaitingRoom") {
        // 탁구장 입장 요청
        this._manageEnterRoom(content);
      }
    }
  };

  // 탁구장 입장 & 게임 시작 관리
  _manageEnterRoom({ roomId, clientId, clientNickname }) {
    if (this.players.length === this.gameInfo.totalPlayerCount) {
      // 입장 불가
      // this._sendEnterImpossibleMsg(roomId); // TODO : 입장 불가 메시지 전달
    } else {
      // 입장 가능
      this._addPlayer(clientId, clientNickname);
      this._sendEnterPossibleMsg(roomId, clientId);
      if (this.players.length === this.gameInfo.totalPlayerCount) {
        // TODO : 리스너 어디서 삭제해야 할까?
        // 서버에게 대기실 삭제를 알리고, 서버가 클라이언트들에게 알렸을 때 삭제해야 하지 않을까?
        this.clientInfo.socket.removeEventListener("message", this.listener);
        const referee = new Referee(this.clientInfo, this.players);
      }
    }
  }

  _addPlayer(id, nickname) {
    // 입장한 플레이어 정보 추가
    let team = this.players.length ? "right" : "left"; // 처음 입장하면 left, 나중에 입장하면 right로 임시 설정
    const player = {
      id: id,
      nickname: nickname,
      team: team,
    };
    this.players.push(player);
  }

  _sendEnterPossibleMsg(roomId, clientId) {
    // 입장 가능 메시지 보내기
    const possibleMessage = {
      sender: "waitingRoom",
      receiver: ["server", "client"],
      event: "enterWaitingRoomResponse",
      content: {
        roomId,
        clientId,
        gameInfo: {
          mode: this.gameInfo.mode,
          totalPlayerCount: this.gameInfo.totalPlayerCount,
        },
      },
    };
    this.clientInfo.socket.send(JSON.stringify(possibleMessage));
  }
}

export default WaitingRoom;
