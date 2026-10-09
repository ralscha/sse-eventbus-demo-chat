import { Component, OnInit, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import {
  AlertController,
  IonButton,
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
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  imports: [
    FormField,
    FormRoot,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonButton,
    IonContent,
    IonList,
    IonInput,
  ],
})
export class SigninPage implements OnInit {
  private readonly username = signal('');
  protected readonly usernameForm = form(this.username, (path) => {
    required(path);
  });
  private readonly navCtrl = inject(NavController);
  private readonly chatService = inject(ChatService);
  private readonly alertCtrl = inject(AlertController);

  async ngOnInit(): Promise<void> {
    const username = sessionStorage.getItem('username');
    if (username !== null) {
      const ok = await this.chatService.signin(username, true);
      if (ok) {
        this.navCtrl.navigateRoot('room');
      } else {
        sessionStorage.removeItem('username');
      }
    }
  }

  async enterUsername(): Promise<void> {
    if (this.usernameForm().invalid()) {
      this.usernameForm().markAsTouched();
      return;
    }

    const username = this.usernameForm().value().trim();

    if (username) {
      const ok = await this.chatService.signin(username);
      if (ok) {
        sessionStorage.setItem('username', username);
        this.usernameForm().reset('');
        this.navCtrl.navigateRoot('room');
      } else {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Username already exists',
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
}
