import {AddRoomPage} from '../add-room/add-room';
import {HomePage} from '../home/home';
import {Room} from "../../room";
import {ChatService} from "../../providers/chat-service";
import {SigninPage} from "../signin/signin";
import {Component} from "@angular/core";
import {NavController} from "ionic-angular";

@Component({
  selector: 'page-room',
  templateUrl: 'room.html',
})
export class RoomPage {

  constructor(private readonly navCtrl: NavController,
              readonly chatService: ChatService) {
  }

  addRoom() {
    this.navCtrl.push(AddRoomPage);
  }

  joinRoom(room: Room) {
    this.navCtrl.push(HomePage, {
      roomId: room.id,
      roomName: room.name
    });
  }

  exit() {
    this.chatService.signout();
    this.navCtrl.setRoot(SigninPage);
  }
}
