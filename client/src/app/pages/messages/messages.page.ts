import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
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
  NavController,
} from '@ionic/angular';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../models/message';
import { ActivatedRoute } from '@angular/router';
import { EmojiPickerComponent } from '../../components/emoji-picker/emoji-picker';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { addIcons } from 'ionicons';
import { exitOutline, happySharp, sendSharp } from 'ionicons/icons';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  imports: [
    FormField,
    FormRoot,
    EmojiPickerComponent,
    RelativeTimePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonList,
    IonFooter,
    IonTextarea,
    IonContent,
  ],
})
export class MessagesPage implements OnInit, OnDestroy {
  readonly chatService = inject(ChatService);
  readonly content = viewChild.required(IonContent);
  private readonly message = signal('');
  protected readonly messageForm = form(this.message, (path) => {
    required(path);
  });
  readonly messages = signal<Message[]>([]);
  roomId: string | null = null;
  roomName: string | null = null;
  showEmojiPicker = false;
  readonly username = computed(() => this.chatService.username());
  readonly messageInput = viewChild.required<ElementRef>('messageInput');
  private readonly route = inject(ActivatedRoute);
  private readonly navCtrl = inject(NavController);
  private readonly chatElement = viewChild.required(IonList, { read: ElementRef });
  private mutationObserver!: MutationObserver;

  constructor() {
    addIcons({ exitOutline, happySharp, sendSharp });
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

      this.chatService.joinRoom(this.roomId, (response) => {
        const newMessages = JSON.parse(response.data) as Message[];
        this.messages.update((messages) => [...messages, ...newMessages].slice(-100));
      });

      this.mutationObserver = new MutationObserver(() => {
        setTimeout(() => {
          this.content().scrollToBottom();
        }, 100);
      });

      this.mutationObserver.observe(this.chatElement().nativeElement, {
        childList: true,
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
    if (this.messageForm().invalid()) {
      this.messageForm().markAsTouched();
      return;
    }

    const message = this.messageForm().value().trim();

    if (message && this.roomId) {
      this.chatService.send(this.roomId, message);
      this.messageForm().reset('');

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
      this.content().scrollToBottom();
    }, 10);
  }

  private focus(): void {
    const messageInput = this.messageInput();
    if (messageInput && messageInput.nativeElement) {
      messageInput.nativeElement.focus();
    }
  }
}
