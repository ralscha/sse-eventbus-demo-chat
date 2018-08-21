import {Component, OnInit} from '@angular/core';
import {AlertController, NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {

  username: string;

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService,
              private readonly alertCtrl: AlertController) {
  }

  async ngOnInit() {
    const username = sessionStorage.getItem('username');
    if (username !== null) {
      const ok = await this.chatService.signin(username, true);
      if (ok) {
        this.navCtrl.goForward('room');
      }
    }
  }

  async enterUsername() {
    const ok = await this.chatService.signin(this.username);
    if (ok) {
      sessionStorage.setItem('username', this.username);
      this.navCtrl.goForward('room');
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
