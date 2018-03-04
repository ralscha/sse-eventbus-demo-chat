import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {AddRoomPage} from '../add-room/add-room';
import {HomePage} from '../home/home';
import {Room} from "../../room";
import {ChatService} from "../../providers/chat-service";
import {SigninPage} from "../signin/signin";

@Component({
  selector: 'page-room',
  templateUrl: 'room.html',
})
export class RoomPage {

  rooms: Room[] = [];

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService) {
  }

  ionViewWillEnter() {
    this.chatService.readRooms().then(rooms => this.rooms = rooms);
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
    this.navCtrl.setRoot(SigninPage);
  }
}
