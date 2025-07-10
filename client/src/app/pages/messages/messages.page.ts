import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import {ChatService} from '../../services/chat.service';
import {Message} from '../../models/message';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {EmojiPickerComponent} from '../../components/emoji-picker/emoji-picker';
import {RelativeTimePipe} from '../../pipes/relative-time.pipe';
import {addIcons} from "ionicons";
import {exitOutline, happySharp, sendSharp} from "ionicons/icons";

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  imports: [FormsModule, EmojiPickerComponent, RelativeTimePipe, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonItem, IonLabel, IonButton, IonIcon, IonList, IonFooter, IonTextarea, IonContent]
})
export class MessagesPage implements OnInit, OnDestroy {
  readonly chatService = inject(ChatService);
  @ViewChild(IonContent, {static: true}) content!: IonContent;
  message = '';
  messages: Message[] = [];
  roomId: string | null = null;
  roomName: string | null = null;
  showEmojiPicker = false;
  @ViewChild('messageInput', {static: true}) messageInput!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly navCtrl = inject(NavController);
  @ViewChild(IonList, {read: ElementRef, static: true})
  private chatElement!: ElementRef;
  private mutationObserver!: MutationObserver;

  constructor() {
    addIcons({exitOutline, happySharp, sendSharp});
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
