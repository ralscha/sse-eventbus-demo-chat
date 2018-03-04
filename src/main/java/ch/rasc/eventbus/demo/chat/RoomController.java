package ch.rasc.eventbus.demo.chat;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
public class RoomController {

	private final List<Room> rooms = new CopyOnWriteArrayList<>();

	@PostMapping("/addRoom")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void register(@RequestBody Room newRoom) {
		this.rooms.add(newRoom);
	}

	@GetMapping("/rooms")
	public List<Room> getRooms() {
		return this.rooms;
	}

}
