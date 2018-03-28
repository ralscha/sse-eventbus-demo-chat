import {Component, ElementRef, ViewChild} from '@angular/core';
import {Content, List, NavParams} from 'ionic-angular';
import {ChatService} from '../../providers/chat-service';
import {Message} from "../../message";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

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

      if (!this.showEmojiPicker) {
        this.focus();
      }
    }
  }

  onFocus() {
    this.showEmojiPicker = false;
    this.content.resize();
    this.scrollToBottom();
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (!this.showEmojiPicker) {
      this.focus();
    }

    this.content.resize();
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
