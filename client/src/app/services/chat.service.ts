import { Service, signal } from '@angular/core';
import { Room } from '../models/room';
import { environment } from '../../environments/environment';

@Service()
export class ChatService {
  readonly rooms = signal<Room[]>([]);
  readonly username = signal<string | null>(null);

  private eventSource: EventSource | null = null;
  private clientId: string | null = null;
  private readonly roomListeners = new Map<string, (event: MessageEvent<string>) => void>();

  private readonly jsonHeaders = new Headers({ 'Content-Type': 'application/json' });

  isLoggedIn(): boolean {
    return this.clientId !== null;
  }

  async signin(username: string, force = false): Promise<boolean> {
    this.disconnect();
    this.clientId = null;
    this.rooms.set([]);
    this.username.set(null);

    let url = 'signin';
    if (force) {
      url = 'signinExisting';
    }

    const response = await fetch(`${environment.SERVER_URL}/${url}`, {
      method: 'POST',
      body: username,
    });
    if (!response.ok) {
      return false;
    }
    const cid = (await response.text()).trim();

    if (!cid) {
      return false;
    }

    this.username.set(username);
    this.clientId = cid;
    this.eventSource = new EventSource(`${environment.SERVER_URL}/register/${this.clientId}`);
    this.eventSource.addEventListener('roomAdded', (rsp) => {
      const newRoom = JSON.parse(rsp.data) as Room;
      this.rooms.update((rooms) => {
        if (rooms.some((room) => room.id === newRoom.id)) {
          return rooms;
        }
        return [...rooms, newRoom].sort((left, right) => left.name.localeCompare(right.name));
      });
    });
    this.eventSource.addEventListener('roomsRemoved', (rsp) => {
      const roomIds = JSON.parse(rsp.data) as string[];
      this.rooms.update((rooms) => rooms.filter((room) => roomIds.indexOf(room.id) === -1));
    });

    const resp = await fetch(`${environment.SERVER_URL}/subscribe`, {
      method: 'POST',
      body: this.clientId,
    });
    if (!resp.ok) {
      this.disconnect();
      this.clientId = null;
      this.username.set(null);
      return false;
    }

    const initialRooms = (await resp.json()) as Room[];
    this.rooms.update((rooms) => {
      const roomsById = new Map(initialRooms.map((room) => [room.id, room]));
      rooms.forEach((room) => roomsById.set(room.id, room));
      return [...roomsById.values()].sort((left, right) => left.name.localeCompare(right.name));
    });

    return true;
  }

  async signout(): Promise<void> {
    const clientId = this.clientId;
    this.disconnect();

    this.clientId = null;
    this.rooms.set([]);
    this.username.set(null);

    if (clientId !== null) {
      await fetch(`${environment.SERVER_URL}/signout`, {
        method: 'POST',
        body: clientId,
      });
    }
  }

  findRoom(roomId: string): Room | undefined {
    return this.rooms().find((room) => room.id === roomId);
  }

  addRoom(roomName: string): Promise<Response> {
    return fetch(`${environment.SERVER_URL}/addRoom`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(roomName),
    });
  }

  send(roomId: string, message: string): Promise<Response> {
    return fetch(`${environment.SERVER_URL}/send`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify({
        clientId: this.clientId,
        message,
        roomId,
      }),
    });
  }

  joinRoom(roomId: string, roomListener: (event: MessageEvent<string>) => void): Promise<Response> {
    const previousListener = this.roomListeners.get(roomId);
    if (previousListener) {
      this.eventSource?.removeEventListener(roomId, previousListener);
    }
    this.roomListeners.set(roomId, roomListener);
    this.eventSource?.addEventListener(roomId, roomListener);

    return fetch(`${environment.SERVER_URL}/join`, {
      method: 'POST',
      headers: this.jsonHeaders,
      body: JSON.stringify({
        clientId: this.clientId,
        roomId,
      }),
    });
  }

  leaveRoom(roomId: string): Promise<Response> {
    const roomListener = this.roomListeners.get(roomId);
    if (roomListener) {
      this.eventSource?.removeEventListener(roomId, roomListener);
      this.roomListeners.delete(roomId);
    }

    return fetch(`${environment.SERVER_URL}/leave`, {
      method: 'POST',
      headers: this.jsonHeaders,
      body: JSON.stringify({
        clientId: this.clientId,
        roomId,
      }),
    });
  }

  private disconnect(): void {
    if (this.eventSource) {
      for (const [roomId, roomListener] of this.roomListeners) {
        this.eventSource.removeEventListener(roomId, roomListener);
      }
      this.eventSource.close();
      this.eventSource = null;
    }
    this.roomListeners.clear();
  }
}
