import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
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
  NavController,
} from '@ionic/angular';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.page.html',
  styleUrls: ['./add-room.page.scss'],
  imports: [
    FormField,
    FormRoot,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonLabel,
    IonButton,
  ],
})
export class AddRoomPage {
  private readonly roomName = signal('');
  protected readonly roomNameForm = form(this.roomName, (path) => {
    required(path);
  });
  private readonly navCtrl = inject(NavController);
  private readonly chatService = inject(ChatService);
  private readonly alertCtrl = inject(AlertController);

  async addRoom(): Promise<void> {
    if (this.roomNameForm().invalid()) {
      this.roomNameForm().markAsTouched();
      return;
    }

    const response = await this.chatService.addRoom(this.roomNameForm().value().trim());
    const flag = await response.json();
    if (flag) {
      this.navCtrl.navigateBack('room');
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Room already exists',
        buttons: [
          {
            text: 'OK',
            role: 'cancel',
          },
        ],
      });
      await alert.present();
    }
  }
}
