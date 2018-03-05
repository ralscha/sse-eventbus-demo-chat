import {Component} from '@angular/core';
import {AlertController, NavController} from 'ionic-angular';
import {RoomPage} from '../room/room';
import {ChatService} from "../../providers/chat-service";

@Component({
  selector: 'page-signin',
  templateUrl: 'signin.html',
})
export class SigninPage {

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService,
              private readonly alertCtrl: AlertController) {
  }

  username: string;

  async enterUsername() {
    const ok = await this.chatService.signin(this.username);
    if (ok) {
      this.navCtrl.setRoot(RoomPage);
    }
    else {
      const alert = this.alertCtrl.create({
        title: 'Error',
        subTitle: 'Username already exists',
        buttons: [{
          text: 'OK',
          role: 'cancel'
        }]
      });
      alert.present();
    }
  }

}
