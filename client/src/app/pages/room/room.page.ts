import {Component, inject} from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import {ChatService} from '../../services/chat.service';
import {Room} from '../../models/room';
import {FormsModule} from "@angular/forms";
import {addIcons} from "ionicons";
import {addSharp, chatbubbleSharp, exitOutline} from "ionicons/icons";

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
  imports: [FormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonList, IonFab, IonFabButton]
})
export class RoomPage {
  readonly chatService = inject(ChatService);
  private readonly navCtrl = inject(NavController);

  constructor() {
    addIcons({exitOutline, chatbubbleSharp, addSharp});
  }

  addRoom(): void {
    this.navCtrl.navigateForward('/add-room');
  }

  joinRoom(room: Room): void {
    this.navCtrl.navigateForward(`/messages/${room.id}`);
  }

  exit(): void {
    sessionStorage.removeItem('username');
    this.chatService.signout();
    this.navCtrl.navigateRoot('/signin');
  }

}
