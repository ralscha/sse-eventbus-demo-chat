package ch.rasc.eventbus.demo.chat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.sse.eventbus.SseEvent;
import ch.rasc.sse.eventbus.SseEventBus;

@RestController
@CrossOrigin
public class MessageController {

	private final Map<String, List<Message>> roomMessages = new ConcurrentHashMap<>();

	private final SseEventBus eventBus;

	public MessageController(SseEventBus eventBus) {
		this.eventBus = eventBus;
	}

	@PostMapping("/leave/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void leaveRoom(@PathVariable("roomId") String roomId,
			@RequestBody String nickname) {

		Message message = new Message();
		message.setMessage(nickname + " has left the room");
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.LEAVE);
		message.setUser(nickname);

		this.eventBus.handleEvent(SseEvent.of(roomId, message));
		this.roomMessages.computeIfAbsent(roomId, k -> new ArrayList<>()).add(message);
	}

	@PostMapping("/join/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void joinRoom(@PathVariable("roomId") String roomId,
			@RequestBody String nickname) {

		Message message = new Message();
		message.setMessage(nickname + " has joined the room");
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.JOIN);
		message.setUser(nickname);

		this.eventBus.handleEvent(SseEvent.of(roomId, message));
		this.roomMessages.computeIfAbsent(roomId, k -> new ArrayList<>()).add(message);
	}

	@PostMapping("/send/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void sendMessage(@PathVariable("roomId") String roomId,
			@RequestBody Message message) {

		message.setType(MessageType.MSG);
		message.setSendDate(System.currentTimeMillis());
		this.eventBus.handleEvent(SseEvent.of(roomId, message));
		this.roomMessages.computeIfAbsent(roomId, k -> new ArrayList<>()).add(message);
	}

	@GetMapping("/messages/{roomId}")
	public List<Message> getMessages(@PathVariable("roomId") String roomId) {
		return this.roomMessages.getOrDefault(roomId, Collections.emptyList());
	}

}
