import {Injectable} from '@angular/core';
import {Room} from '../models/room';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  rooms: Room[] = [];
  username: string | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eventSource: any = null;
  private clientId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private roomListener: ((resp: any) => any) | null = null;

  private jsonHeaders = new Headers({'Content-Type': 'application/json'});

  isLoggedIn(): boolean {
    return this.clientId !== null;
  }

  async signin(username: string, force = false): Promise<boolean> {
    this.clientId = null;
    this.rooms = [];
    this.username = null;

    let url = 'signin';
    if (force) {
      url = 'signinExisting';
    }

    const response = await fetch(`${environment.SERVER_URL}/${url}`, {
      method: 'POST',
      body: username
    });
    const cid = await response.text();

    if (!cid) {
      return false;
    }

    this.username = username;
    this.clientId = cid;
    this.eventSource = new EventSource(`${environment.SERVER_URL}/register/${this.clientId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.eventSource.addEventListener('roomAdded', (rsp: any) => {
      const newRoom = JSON.parse(rsp.data);
      this.rooms.push(newRoom);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.eventSource.addEventListener('roomsRemoved', (rsp: any) => {
      const roomIds = JSON.parse(rsp.data);
      this.rooms = this.rooms.filter(room => roomIds.indexOf(room.id) === -1);
    });

    const resp = await fetch(`${environment.SERVER_URL}/subscribe`, {
      method: 'POST',
      body: this.clientId
    });

    this.rooms = await resp.json();

    return true;
  }

  async signout(): Promise<void> {
    await fetch(`${environment.SERVER_URL}/signout`, {
      method: 'POST',
      body: this.clientId
    });

    this.clientId = null;
    this.rooms = [];
    this.username = null;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  findRoom(roomId: string): Room | undefined {
    return this.rooms.find(room => room.id === roomId);
  }

  addRoom(roomName: string): Promise<Response> {
    return fetch(`${environment.SERVER_URL}/addRoom`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: roomName
    });
  }

  send(roomId: string, message: string): Promise<Response> {
    return fetch(`${environment.SERVER_URL}/send`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify({
        clientId: this.clientId,
        message,
        roomId
      })
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  joinRoom(roomId: string, roomListener: (resp: any) => any): Promise<Response> {
    this.roomListener = roomListener;
    this.eventSource.addEventListener(roomId, this.roomListener);

    return fetch(`${environment.SERVER_URL}/join`, {
      method: 'POST',
      headers: this.jsonHeaders,
      body: JSON.stringify({
        clientId: this.clientId,
        roomId
      })
    });
  }

  leaveRoom(roomId: string): Promise<Response> {
    this.eventSource.removeEventListener(roomId, this.roomListener);

    return fetch(`${environment.SERVER_URL}/leave`, {
      method: 'POST',
      headers: this.jsonHeaders,
      body: JSON.stringify({
        clientId: this.clientId,
        roomId
      })
    });
  }
}
