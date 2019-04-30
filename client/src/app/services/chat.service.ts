import {Injectable} from '@angular/core';
import {Room} from '../models/room';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  rooms: Room[] = null;
  username: string = null;

  private eventSource: any;
  private clientId: string = null;
  private roomListener: (resp: any) => any;

  private jsonHeaders = new Headers({'Content-Type': 'application/json'});

  isLoggedIn() {
    return this.clientId !== null;
  }

  async signin(username: string, force: boolean = false): Promise<boolean> {
    this.clientId = null;
    this.rooms = null;
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
    this.eventSource.addEventListener('roomAdded', rsp => {
      const newRoom = JSON.parse(rsp.data);
      this.rooms.push(newRoom);
    });
    this.eventSource.addEventListener('roomsRemoved', rsp => {
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

  async signout() {
    await fetch(`${environment.SERVER_URL}/signout`, {
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

  findRoom(roomId: string): Room {
    return this.rooms.find(room => room.id === roomId);
  }

  addRoom(roomName: string): Promise<Response> {
    return fetch(`${environment.SERVER_URL}/addRoom`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: roomName
    });
  }

  send(roomId: string, message: string) {
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

  joinRoom(roomId: string, roomListener: (resp: any) => any) {
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

  leaveRoom(roomId: string) {
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
