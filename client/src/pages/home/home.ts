import {Component, ViewChild} from '@angular/core';
import {Content, NavParams} from 'ionic-angular';
import {ChatService} from '../../providers/chat-service';
import {Message} from "../../message";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild(Content) content: Content;

  message: string;
  messages:Message[] = [];
  roomId: string;
  roomName: string;

  constructor(private readonly navParams: NavParams,
              readonly chatService: ChatService) {
  }

  ionViewWillEnter() {
    this.roomId = this.navParams.get('roomId');
    this.roomName = this.navParams.get('roomName');

    this.chatService.joinRoom(this.roomId, response => {
      this.messages.push(...JSON.parse(response.data));
      if (this.messages.length > 100) {
        this.messages.shift();
      }
      this.scrollToBottom();
    });
  }

  ionViewWillLeave() {
    this.chatService.leaveRoom(this.roomId);
  }

  sendMessage() {
    this.chatService.send(this.roomId, this.message);
    this.message = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 10);
  }

}
