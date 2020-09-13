import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IonContent, IonList, NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';
import {Message} from '../../models/message';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit, OnDestroy {

  @ViewChild(IonContent, {static: true}) content!: IonContent;

  message = '';
  messages: Message[] = [];
  roomId: string | null = null;
  roomName: string | null = null;
  showEmojiPicker = false;

  @ViewChild('messageInput', {static: true}) messageInput!: ElementRef;

  @ViewChild(IonList, {read: ElementRef, static: true})
  private chatElement!: ElementRef;
  private mutationObserver!: MutationObserver;

  constructor(private readonly route: ActivatedRoute,
              private readonly navCtrl: NavController,
              readonly chatService: ChatService) {
  }

  async exit(): Promise<void> {
    sessionStorage.removeItem('username');
    await this.chatService.signout();
    this.navCtrl.navigateRoot('/signin');
  }


  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id');
    if (this.roomId) {
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

      this.mutationObserver = new MutationObserver(() => {
        setTimeout(() => {
          this.content.scrollToBottom();
        }, 100);
      });

      this.mutationObserver.observe(this.chatElement.nativeElement, {
        childList: true
      });
    }
  }

  ngOnDestroy(): void {
    this.mutationObserver.disconnect();
    if (this.roomId) {
      this.chatService.leaveRoom(this.roomId);
    }
  }

  sendMessage(): void {
    if (this.message && this.message.trim()) {
      if (this.roomId) {
        this.chatService.send(this.roomId, this.message);
      }
      this.message = '';

      this.onFocus();
    }
  }

  onFocus(): void {
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (!this.showEmojiPicker) {
      this.focus();
    }

    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 10);
  }

  private focus(): void {
    if (this.messageInput && this.messageInput.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

}
