import {Component, inject} from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import {ChatService} from '../../services/chat.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.page.html',
  styleUrls: ['./add-room.page.scss'],
  imports: [FormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonList, IonItem, IonInput, IonLabel, IonButton]
})
export class AddRoomPage {
  roomname = '';
  private readonly navCtrl = inject(NavController);
  private readonly chatService = inject(ChatService);
  private readonly alertCtrl = inject(AlertController);

  async addRoom(): Promise<void> {
    const response = await this.chatService.addRoom(this.roomname);
    const flag = await response.json();
    if (flag) {
      this.navCtrl.navigateBack('room');
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Room already exists',
        buttons: [{
          text: 'OK',
          role: 'cancel'
        }]
      });
      await alert.present();
    }
  }

}
