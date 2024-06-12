import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface PingpongClient extends WebSocket {
  isInit: boolean;
  id: number;
  nickname: string;
}

interface PingpongMsg {
  sender: string;
  receiver: string[];
  event: string;
  content?: any;
}

interface PingPongRoomInfo {
  state: 'WAITING' | 'PLAYING';
  roomId: string;
  hostClient: PingpongClient;
  playerList: PingpongClient[];
}

@Injectable()
export class WebsocketService implements OnModuleInit {
  private wss: Server;
  private clientMap = new Map<number, PingpongClient>();
  private pingpongRoomMap = new Map<string, PingPongRoomInfo>();

  onModuleInit() {
    this.wss = new Server({ port: 3001 });
    this.wss.on('connection', (client: PingpongClient) => {
      console.log('Client connected');
      client.isInit = false;

      client.on('message', (message: ArrayBuffer) => {
        let pingpongMsg: PingpongMsg;
        try {
          console.log(message.toString());
          pingpongMsg = JSON.parse(message.toString());
        } catch (e) {
          console.log(e);
          client.send('why you send this msg?');
          client.send(message.toString());
          return;
        }
        const { sender, receiver, event, content } = pingpongMsg;
        if (!client.isInit) {
          if (event === 'initClient') {
            this.initClient(client, content?.clientId, content?.clientNickname);
          } else {
            this.sendNotInitMsg(client);
            return;
          }
        }
        if (receiver.includes('server')) {
          if (event === 'createWaitingRoom') {
            this.createWaitingRoom(client, content.gameInfo);
          } else if (event === 'getWaitingRoomList') {
            this.getWaitingRoomList(client);
          } else if (event === 'enterWaitingRoomResponse') {
            this.enterWaitingRoomResponse(client, pingpongMsg);
          } else if (event === 'startGame') {
            this.setPlayingStatePingpongRoom(client, pingpongMsg);
          }
        }
        if (receiver.includes('player')) {
          const { roomId } = content;
          if (!roomId || !this.pingpongRoomMap.has(roomId)) {
            this.sendNoRoomMsg(client, pingpongMsg);
            return;
          }
          const playerList = this.pingpongRoomMap.get(roomId).playerList;
          const msg = { ...pingpongMsg };
          msg.receiver = ['player'];
          playerList.forEach((player) => {
            player.send(JSON.stringify(msg));
          });
        }

        if (receiver.includes('waitingRoom')) {
          this.sendMsgToHostClient(client, pingpongMsg, 'waitingRoom');
        }
        if (receiver.includes('referee')) {
          this.sendMsgToHostClient(client, pingpongMsg, 'referee');
        }
        if (receiver.includes('pingpongBoard')) {
          this.sendMsgToHostClient(client, pingpongMsg, 'pingpongBoard');
        }
      });

      client.on('close', () => {
        console.log('Client disconnected');
        if (!client.isInit) return;
        // ToDo: 종료시 맵 정리
        this.pingpongRoomMap.forEach((pingpongRoom) => {
          if (pingpongRoom.hostClient === client) {
            console.log('host client is out');
            //방에 있는 회원 나가는 처리 필요함
            this.pingpongRoomMap.delete(pingpongRoom.roomId);
          }
        });
      });
    });

    console.log('WebSocket server started on port 3001');
  }

  private setPlayingStatePingpongRoom(client, pingpongMsg) {
    const { sender, receiver, event, content } = pingpongMsg;
    const { roomId } = content;
    if (this.pingpongRoomMap.has(roomId)) {
      this.sendNoRoomMsg(client, pingpongMsg);
      return;
    }
    this.pingpongRoomMap.get(roomId).state = 'PLAYING';
  }

  private sendMsgToHostClient(client, pingpongMsg, target) {
    const { sender, receiver, event, content } = pingpongMsg;
    const { roomId } = content;
    if (!roomId || !this.pingpongRoomMap.has(roomId)) {
      this.sendNoRoomMsg(client, pingpongMsg);
      return;
    }
    const hostClient = this.pingpongRoomMap.get(roomId).hostClient;
    const msg = { ...pingpongMsg };
    msg.receiver = [target];
    hostClient.send(JSON.stringify(msg));
  }

  private enterWaitingRoomResponse(
    client: PingpongClient,
    pingpongMsg: PingpongMsg,
  ) {
    const { content } = pingpongMsg;
    const { roomId, clientId } = content;
    if (!this.pingpongRoomMap.has(roomId)) {
      this.sendNoRoomMsg(client, pingpongMsg);
      return;
    }
    const pingpongRoom = this.pingpongRoomMap.get(roomId);
    if (pingpongRoom.state === 'PLAYING') {
      this.sendAlreadyPlaying(client);
      return;
    }
    const player = this.clientMap.get(clientId);
    pingpongRoom.playerList.push(player);
    player.send(JSON.stringify(pingpongMsg));
  }

  private sendAlreadyPlaying(client: PingpongClient) {
    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'AlreadyPlaying',
      content: {},
    };
    console.log(msg);
    client.send(JSON.stringify(msg));
  }

  private sendNoRoomMsg(client: PingpongClient, clientMsg: any) {
    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'noRoom',
      content: { clientMsg },
    };
    console.log(msg);
    client.send(JSON.stringify(msg));
  }

  private async getWaitingRoomList(client: PingpongClient) {
    const gameInfoPromiseList = [];
    this.pingpongRoomMap.forEach((waitingRoom) => {
      if (waitingRoom.state !== 'WAITING') return;
      const listener = (res, message: ArrayBuffer) => {
        let pingpongMsg;
        try {
          pingpongMsg = JSON.parse(message.toString());
        } catch (e) {
          return;
        }
        const { sender, receiver, event, content } = pingpongMsg;
        if (event === 'getWaitingRoomResponse') {
          waitingRoom.hostClient.off('message', listener); // 이벤트 핸들러 제거
          res({
            roomId: content.roomId,
            mode: content.waitingRoomInfo.mode,
            currentPlayerCount: content.waitingRoomInfo.currentPlayerCount,
            totalPlayerCount: content.waitingRoomInfo.totalPlayerCount,
          });
        }
      };
      const retPromise = new Promise<any>((res) => {
        waitingRoom.hostClient.on('message', listener.bind(this, res));
      });
      gameInfoPromiseList.push(retPromise);

      waitingRoom.hostClient.send(
        JSON.stringify({
          sender: 'server',
          receiver: ['waitingRoom'],
          event: 'getWaitingRoom',
          content: {},
        }),
      );
    });

    const gameInfoList = await Promise.all(gameInfoPromiseList);

    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'getWaitingRoomResponse',
      content: { gameInfoList },
    };
    console.log(msg);
    client.send(JSON.stringify(msg));
  }

  private createWaitingRoom(client: PingpongClient, gameInfo: any) {
    const roomId = uuidv4();
    const roomInformation: PingPongRoomInfo = {
      state: 'WAITING',
      roomId,
      hostClient: client,
      playerList: [],
    };
    this.pingpongRoomMap.set(roomId, roomInformation);

    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'appointWaitingRoom',
      content: { roomId, gameInfo },
    };
    client.send(JSON.stringify(msg));
  }

  private initClient(
    client: PingpongClient,
    clientId: number,
    clientNickname: string,
  ) {
    if (this.clientMap.has(clientId)) {
      const msg = {
        sender: 'server',
        receiver: ['unauthenticatedClient'],
        event: 'duplicateClientId',
      };
      console.log(msg);
      client.send(JSON.stringify(msg));
      return;
    }
    this.clientMap.set(clientId, client);
    client.id = clientId;
    client.nickname = clientNickname;
    client.isInit = true;
    const msg = {
      sender: 'server',
      receiver: ['unauthenticatedClient'],
      event: 'registerClientSuccess',
    };
    console.log(msg);
    client.send(JSON.stringify(msg));
  }

  private sendNotInitMsg(client: PingpongClient) {
    const msg = {
      sender: 'server',
      receiver: ['unauthenticatedClient'],
      event: 'notInit',
    };
    console.log(msg);
    client.send(JSON.stringify(msg));
  }
}
