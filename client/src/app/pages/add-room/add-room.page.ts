import {Component} from '@angular/core';
import {AlertController, NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';

@Component({
  selector: 'app-add-room',
  templateUrl: './add-room.page.html',
  styleUrls: ['./add-room.page.scss'],
})
export class AddRoomPage {

  roomname = '';

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService,
              private readonly alertCtrl: AlertController) {
  }

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
