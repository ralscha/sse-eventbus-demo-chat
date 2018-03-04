import uuid from 'uuid';
import {Room} from "../room";
import {Message} from "../message";

declare var EventSource: any;

export class ChatService {

  user: string;

  private eventSource: any;
  public clientId: string;
  private subscriptions: { [event: string]: (resp: any) => any } | {} = {};

  private jsonHeaders = new Headers({'Content-Type': 'application/json'});

  constructor() {
    this.clientId = uuid.v4();
  }

  start() {
    this.stop();

    const eventNames = Object.keys(this.subscriptions);
    if (eventNames.length > 0) {
      this.eventSource = new EventSource(`http://localhost:8080/register/${this.clientId}/${eventNames.join(',')}`);

      for (const eventName of eventNames) {
        this.eventSource.addEventListener(eventName, this.subscriptions[eventName]);
      }

    }
  }

  subscribe(eventName: string, listener: (resp: any) => any) {
    this.subscriptions = {[eventName]: listener}
    this.start();
  }

  unsubscribe(eventName: string) {
    delete this.subscriptions[eventName];
    this.start();
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  addRoom(name: string): Promise<Response> {
    const room: Room = {id: uuid.v4(), name};

    return fetch('http://localhost:8080/addRoom', {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(room)
    });
  }

  async readRooms(): Promise<Room[]> {
    const response = await fetch('http://localhost:8080/rooms');
    return response.json();
  }

  async readMessages(roomId: string): Promise<Message[]> {
    const response = await fetch(`http://localhost:8080/messages/${roomId}`);
    return response.json();
  }

  send(roomId: string, message: Message) {
    return fetch(`http://localhost:8080/send/${roomId}`, {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(message)
    });
  }

  joinRoom(roomId: string, nickname: string) {
    return fetch(`http://localhost:8080/join/${roomId}`, {
      method: 'POST',
      body: nickname
    });
  }

  leaveRoom(roomId: string, nickname: string) {
    return fetch(`http://localhost:8080/leave/${roomId}`, {
      method: 'POST',
      body: nickname
    });
  }

}
