package ch.rasc.eventbus.demo.chat;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.CrossOrigin;
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

	private final Map<String, Room> rooms = new ConcurrentHashMap<>();

	private final SseEventBus eventBus;

	private final AtomicLong roomIdGenerator = new AtomicLong();

	private final AtomicLong clientIdGenerator = new AtomicLong();

	private final Map<String, String> users = new ConcurrentHashMap<>();

	public ChatController(SseEventBus eventBus) {
		this.eventBus = eventBus;
	}

	@PostMapping("/signin")
	public synchronized String signin(@RequestBody String nickname) {
		if (nickname == null) {
			return null;
		}
		String normalizedNickname = nickname.strip();
		if (normalizedNickname.isEmpty() || this.users.containsValue(normalizedNickname)) {
			return null;
		}
		String clientId = String.valueOf(this.clientIdGenerator.incrementAndGet());
		this.users.put(clientId, normalizedNickname);
		return clientId;
	}

	@PostMapping("/signinExisting")
	public synchronized String signinExisting(@RequestBody String nickname) {
		if (nickname == null || nickname.isBlank()) {
			return null;
		}
		String normalizedNickname = nickname.strip();

		String clientId = null;
		for (Map.Entry<String, String> entry : this.users.entrySet()) {
			if (entry.getValue().equals(normalizedNickname)) {
				clientId = entry.getKey();
				break;
			}
		}

		if (clientId == null) {
			clientId = String.valueOf(this.clientIdGenerator.incrementAndGet());
			this.users.put(clientId, normalizedNickname);
		}

		return clientId;
	}

	@PostMapping("/signout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void signout(@RequestBody String clientId) {
		this.users.remove(clientId);
		this.eventBus.unregisterClient(clientId);
	}

	@EventListener
	public void unregisterClient(ClientUnregisterEvent event) {
		this.users.remove(event.clientId());
	}

	@PostMapping("/subscribe")
	public List<Room> subscribe(@RequestBody String clientId) {
		if (!this.users.containsKey(clientId)) {
			return List.of();
		}
		this.eventBus.subscribe(clientId, "roomAdded");
		this.eventBus.subscribe(clientId, "roomsRemoved");

		return this.rooms.values().stream().sorted(Comparator.comparing(Room::name)).toList();
	}

	@PostMapping("/addRoom")
	public synchronized boolean addRoom(@RequestBody String roomName) {
		if (roomName == null || roomName.isBlank()) {
			return false;
		}
		String normalizedRoomName = roomName.strip();

		if (this.rooms.values().stream().anyMatch(room -> room.name().equals(normalizedRoomName))) {
			return false;
		}

		Room room = new Room(String.valueOf(this.roomIdGenerator.incrementAndGet()), normalizedRoomName);
		this.rooms.put(room.id(), room);

		this.eventBus.handleEvent(SseEvent.of("roomAdded", room));
		return true;
	}

	@PostMapping("/leave")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void leaveRoom(@RequestBody ClientRequest request) {
		if (!isValidRoomRequest(request)) {
			return;
		}
		String userName = this.users.get(request.clientId());

		Message message = new Message(MessageType.LEAVE, userName, userName + " has left the room",
				System.currentTimeMillis());
		store(request.roomId(), message);

		this.eventBus.unsubscribe(request.clientId(), request.roomId());

		this.eventBus.handleEvent(SseEvent.of(request.roomId(), List.of(message)));
	}

	@PostMapping("/join")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void joinRoom(@RequestBody ClientRequest request) {
		if (!isValidRoomRequest(request)) {
			return;
		}
		String userName = this.users.get(request.clientId());

		Message message = new Message(MessageType.JOIN, userName, userName + " has joined the room",
				System.currentTimeMillis());
		store(request.roomId(), message);

		this.eventBus.subscribe(request.clientId(), request.roomId());

		this.eventBus.handleEvent(SseEvent.builder()
			.event(request.roomId())
			.data(getMessages(request.roomId()))
			.addClientId(request.clientId())
			.build());

		this.eventBus.handleEvent(SseEvent.builder()
			.event(request.roomId())
			.data(List.of(message))
			.addExcludeClientId(request.clientId())
			.build());
	}

	@PostMapping("/send")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void sendMessage(@RequestBody ClientRequest request) {
		if (!isValidRoomRequest(request) || request.message() == null || request.message().isBlank()) {
			return;
		}
		String userName = this.users.get(request.clientId());

		Message message = new Message(MessageType.MSG, userName, request.message().strip(), System.currentTimeMillis());
		store(request.roomId(), message);

		this.eventBus.handleEvent(SseEvent.of(request.roomId(), List.of(message)));
	}

	private List<Message> getMessages(String roomId) {
		Cache<Message, Boolean> cache = this.roomMessages.get(roomId);
		if (cache != null) {
			return cache.asMap().keySet().stream().sorted(Comparator.comparing(Message::sendDate)).toList();
		}
		return List.of();
	}

	private void store(String roomId, Message message) {
		this.roomMessages
			.computeIfAbsent(roomId,
					_ -> Caffeine.newBuilder().expireAfterWrite(6, TimeUnit.HOURS).maximumSize(100).build())
			.put(message, true);
	}

	private boolean isValidRoomRequest(ClientRequest request) {
		return request != null && request.clientId() != null && request.roomId() != null
				&& this.users.containsKey(request.clientId()) && this.rooms.containsKey(request.roomId());
	}

	@Scheduled(fixedDelay = 21_600_000)
	public void removeOldRooms() {
		// every 6 hours
		Set<String> oldRoomIds = new HashSet<>();
		this.roomMessages.forEach((k, v) -> {
			v.cleanUp();
			if (v.estimatedSize() == 0) {
				oldRoomIds.add(k);
			}
		});

		oldRoomIds.forEach(this.roomMessages::remove);
		oldRoomIds.forEach(this.rooms::remove);

		if (!oldRoomIds.isEmpty()) {
			this.eventBus.handleEvent(SseEvent.of("roomsRemoved", oldRoomIds));
		}
	}

}
