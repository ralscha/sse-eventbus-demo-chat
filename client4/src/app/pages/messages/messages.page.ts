import {Component, ElementRef, ViewChild} from '@angular/core';
import {Content, List, NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';
import {Message} from '../../models/message';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-messages',
  templateUrl: 'messages.page.html',
  styleUrls: ['messages.page.scss'],
})
export class MessagesPage {

  @ViewChild(Content) content: Content;

  message: string;
  messages: Message[] = [];
  roomId: string;
  roomName: string;
  showEmojiPicker = false;

  @ViewChild('messageInput') messageInput: ElementRef;

  @ViewChild(List, {read: ElementRef})
  private chatElement: ElementRef;
  private mutationObserver: MutationObserver;

  constructor(private readonly route: ActivatedRoute,
              private readonly navCtrl: NavController,
              readonly chatService: ChatService) {
  }

  async exit() {
    sessionStorage.removeItem('username');
    await this.chatService.signout();
    this.navCtrl.goRoot('/signin');
  }


  ionViewWillEnter() {
    this.roomId = this.route.snapshot.paramMap.get('id');
    const room = this.chatService.findRoom(this.roomId);
    if (room) {
      this.roomName = room.name;
    } else {
      this.roomName = null;
    }

    this.chatService.joinRoom(this.roomId, response => {
      this.messages.push(...JSON.parse(response.data));
      if (this.messages.length > 100) {
        this.messages.shift();
      }
    });

    this.mutationObserver = new MutationObserver(mutations => {
      this.content.scrollToBottom();
    });

    this.mutationObserver.observe(this.chatElement.nativeElement, {
      childList: true
    });

  }

  ionViewWillLeave() {
    this.mutationObserver.disconnect();
    this.chatService.leaveRoom(this.roomId);
  }

  sendMessage() {
    if (this.message && this.message.trim()) {
      this.chatService.send(this.roomId, this.message);
      this.message = '';

      this.onFocus();
    }
  }

  onFocus() {
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (!this.showEmojiPicker) {
      this.focus();
    }

    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 10);
  }

  private focus() {
    if (this.messageInput && this.messageInput.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

}
