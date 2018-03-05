import {Room} from "../room";
import {ENV} from '@app/env';
import {Injectable, NgZone} from "@angular/core";

declare var EventSource: any;

@Injectable()
export class ChatService {

  rooms: Room[];
  username: string;

  private eventSource: any;
  private clientId: string;
  private roomListener: (resp: any) => any;

  private jsonHeaders = new Headers({'Content-Type': 'application/json'});

  constructor(private readonly ngZone: NgZone) {
  }

  async signin(username: string): Promise<boolean> {
    this.clientId = null;
    this.rooms = null;
    this.username = null;

    const response = await fetch(`${ENV.SERVER_URL}/signin`, {
      method: 'POST',
      body: username
    });
    const cid = await response.text();

    if (!cid) {
      return false;
    }

    this.username = username;

    this.clientId = cid;
    this.eventSource = new EventSource(`${ENV.SERVER_URL}/register/${this.clientId}`);
    this.eventSource.addEventListener('roomAdded', response => {
      const newRoom = JSON.parse(response.data);
      this.ngZone.run(() => this.rooms.push(newRoom));
    });
    this.eventSource.addEventListener('roomsRemoved', response => {
      const roomIds = JSON.parse(response.data);
      this.ngZone.run(() => this.rooms = this.rooms.filter(room => roomIds.indexOf(room.id) === -1));
    });

    const resp = await fetch(`${ENV.SERVER_URL}/subscribe`, {
      method: 'POST',
      body: this.clientId
    });
    this.ngZone.run(async () => this.rooms = await resp.json());

    return true;
  }

  async signout() {
    await fetch(`${ENV.SERVER_URL}/signout`, {
      method: 'POST',
      body: this.clientId
    });

    this.clientId = null;
    this.rooms = null;
    this.username = null;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  addRoom(roomName: string): Promise<Response> {
    return fetch(`${ENV.SERVER_URL}/addRoom`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: roomName
    });
  }

  send(roomId: string, message: string) {
    return fetch(`${ENV.SERVER_URL}/send`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify({
        clientId: this.clientId,
        message,
        roomId
      })
    });
  }

  joinRoom(roomId: string, roomListener: (resp: any) => any) {
    this.roomListener = roomListener;
    this.eventSource.addEventListener(roomId, this.roomListener);

    return fetch(`${ENV.SERVER_URL}/join`, {
      method: 'POST',
      headers: this.jsonHeaders,
      body: JSON.stringify({
        clientId: this.clientId,
        roomId
      })
    });
  }

  leaveRoom(roomId: string) {
    this.eventSource.removeEventListener(roomId, this.roomListener);

    return fetch(`${ENV.SERVER_URL}/leave`, {
      method: 'POST',
      headers: this.jsonHeaders,
      body: JSON.stringify({
        clientId: this.clientId,
        roomId
      })
    });
  }

}
