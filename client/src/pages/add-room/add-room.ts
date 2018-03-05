import {Component} from '@angular/core';
import {AlertController, NavController} from 'ionic-angular';
import {ChatService} from "../../providers/chat-service";

@Component({
  selector: 'page-add-room',
  templateUrl: 'add-room.html',
})
export class AddRoomPage {

  roomname: string;

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService,
              private readonly alertCtrl: AlertController) {
  }

  async addRoom() {
    const response = await this.chatService.addRoom(this.roomname);
    const flag = await response.json();
    console.log(flag);
    if (flag) {
      this.navCtrl.pop();
    }
    else {
      const alert = this.alertCtrl.create({
        title: 'Error',
        subTitle: 'Room already exists',
        buttons: [{
          text: 'OK',
          role: 'cancel'
        }]
      });
      alert.present();
    }
  }

}
