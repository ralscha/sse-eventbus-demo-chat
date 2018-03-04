import {Component, ViewChild} from '@angular/core';
import {Content, NavParams} from 'ionic-angular';
import {ChatService} from '../../providers/chat-service';

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

    await this.chatService.joinRoom(this.roomId, this.chatService.user);
    this.messages = await this.chatService.readMessages(this.roomId);

    this.scrollToBottom();

    this.chatService.subscribe(this.roomId, response => {
      this.messages.push(JSON.parse(response.data));
      this.scrollToBottom();
    });
  }

  async ionViewWillLeave() {
    this.chatService.unsubscribe(this.roomId);
    await this.chatService.leaveRoom(this.roomId, this.chatService.user);
  }

  async sendMessage() {
    await this.chatService.send(this.roomId, {
      user: this.chatService.user,
      message: this.message
    });
    this.message = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 10);
  }

}
