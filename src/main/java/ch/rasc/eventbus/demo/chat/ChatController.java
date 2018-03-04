package ch.rasc.eventbus.demo.chat;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import ch.rasc.sse.eventbus.SseEvent;
import ch.rasc.sse.eventbus.SseEventBus;

@RestController
@CrossOrigin
public class ChatController {

	private final Map<String, Cache<Message, Boolean>> roomMessages = new ConcurrentHashMap<>();

	private final List<Room> rooms = new CopyOnWriteArrayList<>();

	private final SseEventBus eventBus;

	public ChatController(SseEventBus eventBus) {
		this.eventBus = eventBus;
	}

	@PostMapping("/subscribe/{clientId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void subscribe(@PathVariable("clientId") String clientId) {
		this.eventBus.subscribe(clientId, "rooms");
		this.eventBus.handleEvent(SseEvent.builder().event("rooms").data(this.rooms)
				.addClientId(clientId).build());
	}

	@PostMapping("/unsubscribe/{clientId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void unsubscribe(@PathVariable("clientId") String clientId) {
		this.eventBus.unregisterClient(clientId);
	}
	
	private List<Message> getMessages(String roomId) {
		Cache<Message, Boolean> cache = this.roomMessages.get(roomId);
		if (cache != null) {
			return cache.asMap().keySet().stream()
					.sorted(Comparator.comparing(Message::getSendDate))
					.collect(Collectors.toList());
		}
		return Collections.emptyList();
	}

	@PostMapping("/addRoom/{clientId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void addRoom(@PathVariable("clientId") String clientId,
			@RequestBody Room newRoom) {
		this.rooms.add(newRoom);

		this.eventBus.handleEvent(
				SseEvent.builder().event("rooms").data(Collections.singleton(newRoom))
						.addExcludeClientId(clientId).build());
	}

	@PostMapping("/leave/{clientId}/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void leaveRoom(@PathVariable("clientId") String clientId,
			@PathVariable("roomId") String roomId, @RequestBody String nickname) {

		Message message = new Message();
		message.setMessage(nickname + " has left the room");
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.LEAVE);
		message.setUser(nickname);
		store(roomId, message);

		this.eventBus.unsubscribe(clientId, roomId);

		this.eventBus.handleEvent(
				SseEvent.builder().event(roomId).data(Collections.singletonList(message))
						.addExcludeClientId(clientId).build());
	}

	@PostMapping("/join/{clientId}/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void joinRoom(@PathVariable("clientId") String clientId,
			@PathVariable("roomId") String roomId, @RequestBody String nickname) {

		Message message = new Message();
		message.setMessage(nickname + " has joined the room");
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.JOIN);
		message.setUser(nickname);
		store(roomId, message);

		this.eventBus.subscribe(clientId, roomId);

		this.eventBus.handleEvent(SseEvent.builder().event(roomId)
				.data(getMessages(roomId)).addClientId(clientId).build());

		this.eventBus.handleEvent(
				SseEvent.builder().event(roomId).data(Collections.singletonList(message))
						.addExcludeClientId(clientId).build());
	}

	@PostMapping("/send/{clientId}/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void sendMessage(@PathVariable("clientId") String clientId,
			@PathVariable("roomId") String roomId, @RequestBody Message message) {

		this.eventBus.handleEvent(
				SseEvent.builder().event(roomId).data(Collections.singleton(message))
						.addExcludeClientId(clientId).build());

		store(roomId, message);
	}

	private void store(String roomId, Message message) {
		this.roomMessages
				.computeIfAbsent(roomId, k -> Caffeine.newBuilder()
						.expireAfterWrite(6, TimeUnit.HOURS).maximumSize(100).build())
				.put(message, true);
	}

}
