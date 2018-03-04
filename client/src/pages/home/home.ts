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
  messages = [];
  roomId: string;
  roomName: string;

  constructor(private readonly navParams: NavParams,
              readonly chatService: ChatService) {
  }

  async ionViewWillEnter() {
    this.roomId = this.navParams.get('roomId');
    this.roomName = this.navParams.get('roomName');

    await this.chatService.joinRoom(this.roomId, response => {
      this.messages.push(...JSON.parse(response.data));
      this.scrollToBottom();
    });
  }

  async ionViewWillLeave() {
    await this.chatService.leaveRoom(this.roomId);
  }

  async sendMessage() {
    const msg: Message = {
      type: 'MSG',
      sendDate: Date.now(),
      user: this.chatService.user,
      message: this.message
    };
    this.messages.push(msg);
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    this.scrollToBottom();

    await this.chatService.send(this.roomId, msg);
    this.message = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 10);
  }

}
