import {Component} from '@angular/core';
import {NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';
import {Room} from '../../models/room';
import {FormsModule} from "@angular/forms";
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
  IonToolbar
} from "@ionic/angular/standalone";
import {addIcons} from "ionicons";
import {addSharp, chatbubbleSharp, exitOutline} from "ionicons/icons";

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
  imports: [FormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonItem, IonLabel, IonButton, IonIcon, IonContent, IonList, IonFab, IonFabButton]
})
export class RoomPage {

  constructor(private readonly navCtrl: NavController,
              readonly chatService: ChatService) {
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
