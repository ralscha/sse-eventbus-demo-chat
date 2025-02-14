import {Component, OnInit} from '@angular/core';
import {AlertController, NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';
import {FormsModule} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonButton, IonContent, IonList, IonInput]
})
export class SigninPage implements OnInit {

  username: string | null = null;

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService,
              private readonly alertCtrl: AlertController) {
  }

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
    if (this.username !== null) {
      const ok = await this.chatService.signin(this.username);
      if (ok) {
        sessionStorage.setItem('username', this.username);
        this.username = '';
        this.navCtrl.navigateRoot('room');
      } else {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Username already exists',
          buttons: [{
            text: 'OK',
            role: 'cancel'
          }]
        });
        await alert.present();
      }
    }
  }


}
