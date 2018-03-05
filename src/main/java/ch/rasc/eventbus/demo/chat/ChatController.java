package ch.rasc.eventbus.demo.chat;

import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

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

	private final AtomicLong roomIdGenerator = new AtomicLong(1);

	private final AtomicLong clientIdGenerator = new AtomicLong(1);

	private final Map<String, String> users = new ConcurrentHashMap<>();

	public ChatController(SseEventBus eventBus) {
		this.eventBus = eventBus;
	}

	@PostMapping("/signin")
	public String signin(@RequestBody String nickname) {
		if (this.users.values().stream().filter(name -> name.equals(nickname)).findAny()
				.isPresent()) {
			return null;
		}
		String clientId = String.valueOf(this.clientIdGenerator.incrementAndGet());
		this.users.put(clientId, nickname);
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
		this.users.remove(event.getClientId());
	}

	@PostMapping("/subscribe")
	public List<Room> subscribe(@RequestBody String clientId) {
		this.eventBus.subscribe(clientId, "roomAdded");
		this.eventBus.subscribe(clientId, "roomsRemoved");

		return this.rooms.values().stream().sorted(Comparator.comparing(Room::getName))
				.collect(Collectors.toList());
	}

	@PostMapping("/addRoom")
	public boolean addRoom(@RequestBody String roomName) {

		if (roomName == null || roomName.trim().length() == 0) {
			return false;
		}

		if (this.rooms.values().stream().filter(room -> room.getName().equals(roomName))
				.findAny().isPresent()) {
			return false;
		}

		Room room = new Room();
		room.setId(String.valueOf(this.roomIdGenerator.incrementAndGet()));
		room.setName(roomName);
		this.rooms.put(room.getId(), room);

		this.eventBus.handleEvent(SseEvent.of("roomAdded", room));
		return true;
	}

	@PostMapping("/leave")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void leaveRoom(@RequestBody ClientRequest request) {
		String userName = this.users.get(request.getClientId());
		if (userName == null) {
			return;
		}

		Message message = new Message();
		message.setMessage(userName + " has left the room");
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.LEAVE);
		message.setUser(userName);
		store(request.getRoomId(), message);

		this.eventBus.unsubscribe(request.getClientId(), request.getRoomId());

		this.eventBus.handleEvent(
				SseEvent.of(request.getRoomId(), Collections.singletonList(message)));
	}

	@PostMapping("/join")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void joinRoom(@RequestBody ClientRequest request) {
		String userName = this.users.get(request.getClientId());
		if (userName == null) {
			return;
		}

		Message message = new Message();
		message.setMessage(userName + " has joined the room");
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.JOIN);
		message.setUser(userName);
		store(request.getRoomId(), message);

		this.eventBus.subscribe(request.getClientId(), request.getRoomId());

		this.eventBus.handleEvent(SseEvent.builder().event(request.getRoomId())
				.data(getMessages(request.getRoomId())).addClientId(request.getClientId())
				.build());

		this.eventBus.handleEvent(SseEvent.builder().event(request.getRoomId())
				.data(Collections.singletonList(message))
				.addExcludeClientId(request.getClientId()).build());
	}

	@PostMapping("/send")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void sendMessage(@RequestBody ClientRequest request) {
		String userName = this.users.get(request.getClientId());
		if (userName == null) {
			return;
		}

		Message message = new Message();
		message.setMessage(request.getMessage());
		message.setSendDate(System.currentTimeMillis());
		message.setType(MessageType.MSG);
		message.setUser(userName);
		store(request.getRoomId(), message);

		this.eventBus.handleEvent(
				SseEvent.of(request.getRoomId(), Collections.singleton(message)));
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

	private void store(String roomId, Message message) {
		this.roomMessages
				.computeIfAbsent(roomId, k -> Caffeine.newBuilder()
						.expireAfterWrite(6, TimeUnit.HOURS).maximumSize(100).build())
				.put(message, true);
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

		this.eventBus.handleEvent(SseEvent.of("roomsRemoved", oldRoomIds));
	}

}
