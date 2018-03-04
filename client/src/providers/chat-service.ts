import uuid from 'uuid';
import {Room} from "../room";
import {Message} from "../message";

declare var EventSource: any;

export class ChatService {

  user: string;

  rooms: Room[] = [];

  private eventSource: any;
  private clientId: string;
  private roomListener:  (resp: any) => any;

  private jsonHeaders = new Headers({'Content-Type': 'application/json'});

  constructor() {
    this.clientId = uuid.v4();
  }

  start() {
    this.stop();
    this.eventSource = new EventSource(`http://localhost:8080/register/${this.clientId}`);
    this.eventSource.addEventListener('rooms', response => {
      this.rooms.push(...JSON.parse(response.data));
    });
  }

  stop() {
    this.rooms = [];
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  addRoom(name: string): Promise<Response> {
    const room: Room = {id: uuid.v4(), name};
    this.rooms.push(room);

    return fetch(`http://localhost:8080/addRoom/${this.clientId}`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(room)
    });
  }

  send(roomId: string, message: Message) {
    return fetch(`http://localhost:8080/send/${this.clientId}/${roomId}`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(message)
    });
  }

  joinRoom(roomId: string, roomListener: (resp: any) => any) {
    this.roomListener = roomListener;
    this.eventSource.addEventListener(roomId, this.roomListener);

    return fetch(`http://localhost:8080/join/${this.clientId}/${roomId}`, {
      method: 'POST',
      body: this.user
    });
  }

  leaveRoom(roomId: string) {
    this.eventSource.removeEventListener(roomId, this.roomListener);

    return fetch(`http://localhost:8080/leave/${this.clientId}/${roomId}`, {
      method: 'POST',
      body: this.user
    });
  }

}
