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
  refereeClient: PingpongClient;
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

      client.on('message', (message: any) => {
        let pingpongMsg: PingpongMsg;
        try {
          pingpongMsg = JSON.parse(message.toString());
        } catch (e) {
          console.log(e);
          client.send('why you send this msg?');
          client.send(JSON.stringify(message));
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
          if (event === 'createPingpongRoom') {
            this.createPingpongRoom(client);
          } else if (event === 'getPingpongRoomList') {
            this.getPingpongRoomList(client);
          } else if (event === 'enterPingpongRoomResponse') {
            this.enterPingpongRoomResponse(pingpongMsg);
          }
        } else if (receiver.includes('player')) {
          const { roomId } = content;
          const playerList = this.pingpongRoomMap.get(roomId).playerList;
          playerList.forEach((player) => {
            player.send(JSON.stringify(message));
          });
        } else if (receiver.includes('referee')) {
          const { roomId } = content;
          const refereeClient = this.pingpongRoomMap.get(roomId).refereeClient;
          refereeClient.send(JSON.stringify(message));
        } else {
          client.send('why you send this msg?');
          client.send(JSON.stringify(message));
        }
      });

      client.on('close', () => {
        // ToDo: 종료시 맵 정리
        console.log('Client disconnected');
      });
    });

    console.log('WebSocket server started on port 3001');
  }

  private enterPingpongRoomResponse(pingpongMsg: PingpongMsg) {
    const { content } = pingpongMsg;
    const { roomId, clientId } = content;
    const player = this.clientMap.get(clientId);
    this.pingpongRoomMap.get(roomId).playerList.push(player);
    player.send(JSON.stringify(pingpongMsg));
  }

  private getPingpongRoomList(client: PingpongClient) {
    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'getPingpongRoomResponse',
      content: { roomIdList: Array.from(this.pingpongRoomMap.keys()) },
    };
    client.send(JSON.stringify(msg));
  }

  private createPingpongRoom(client: PingpongClient) {
    const roomId = uuidv4();
    const roomInformation: PingPongRoomInfo = {
      refereeClient: client,
      playerList: [],
    };
    this.pingpongRoomMap.set(roomId, roomInformation);

    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'appointReferee',
      content: { roomId },
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
        receiver: ['client'],
        event: 'duplicateClientId',
      };
      client.send(JSON.stringify(msg));
      return;
    }
    this.clientMap.set(clientId, client);
    client.id = clientId;
    client.nickname = clientNickname;
    client.isInit = true;
    const msg = {
      sender: 'server',
      receiver: ['client'],
      event: 'registerClientSuccess',
    };
    client.send(JSON.stringify(msg));
  }

  private sendNotInitMsg(client: PingpongClient) {
    const msg = { sender: 'server', receiver: ['client'], event: 'notInit' };
    client.send(JSON.stringify(msg));
  }
}
