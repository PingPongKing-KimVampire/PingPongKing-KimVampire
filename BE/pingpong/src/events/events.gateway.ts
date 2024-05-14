import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'ws';

@Injectable()
export class WebsocketService implements OnModuleInit {
  private wss: Server;
  private roomId = 0;
  private socketMap = new Map();
  private clientSet = new Set();

  onModuleInit() {
    this.wss = new Server({ port: 3001 });
    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', (message: any) => {
        const data = JSON.parse(message.toString());
        const { sender, receiver } = data;
        console.log('sender:', sender);
        console.log('receiver:', receiver);
        console.log(data);
        if (receiver === 'server') {
          const { event } = data;
          if (event === 'createPingpongRoom') {
            const { clientId } = data;
            if (this.clientSet.has(clientId)) {
              ws.send(JSON.stringify({ Error: 'you have duplicate name2' }));
              return;
            }
            this.roomId++;
            this.clientSet.add(clientId);
            this.socketMap.set(this.roomId, []);
            ws.send(JSON.stringify({ roomId: this.roomId }));
          } else if (event === 'enterPingpongRoom') {
            const { roomId, clientId } = data;
            if (this.socketMap.has(roomId)) {
              ws.send(JSON.stringify({ Error: 'no Room' }));
              return;
            }
            this.clientSet.add(clientId);
            this.socketMap[roomId].push(ws);
          }
        } else {
          ws.send(message);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    console.log('WebSocket server started on port 3001');
  }
}
