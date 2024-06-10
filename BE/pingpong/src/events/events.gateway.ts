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
        // ToDo: 종료시 맵 정리
        console.log('Client disconnected');
      });
    });

    console.log('WebSocket server started on port 3001');
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
    const player = this.clientMap.get(clientId);
    this.pingpongRoomMap.get(roomId).playerList.push(player);
    player.send(JSON.stringify(pingpongMsg));
  }

  private sendNoRoomMsg(client: PingpongClient, clientMsg: any) {
    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'noRoom',
      content: { clientMsg },
    };
    client.send(JSON.stringify(msg));
  }

  //추후 서버에서 관리하는 방과 관계없이 응답하는 waiting Room의 정보를 반환하게 변경
  private getWaitingRoomList(client: PingpongClient) {
    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'getWaitingRoomResponse',
      content: { roomIdList: Array.from(this.pingpongRoomMap.keys()) },
    };
    client.send(JSON.stringify(msg));
  }

  private createWaitingRoom(client: PingpongClient, gameInfo: any) {
    const roomId = uuidv4();
    const roomInformation: PingPongRoomInfo = {
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
    client.send(JSON.stringify(msg));
  }
}
