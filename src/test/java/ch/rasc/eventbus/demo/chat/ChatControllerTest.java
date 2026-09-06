package ch.rasc.eventbus.demo.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ScheduledExecutorService;

import org.junit.jupiter.api.Test;

import ch.rasc.sse.eventbus.DefaultSubscriptionRegistry;
import ch.rasc.sse.eventbus.SseEvent;
import ch.rasc.sse.eventbus.SseEventBus;
import ch.rasc.sse.eventbus.config.SseEventBusConfigurer;

class ChatControllerTest {

	@Test
	void normalizesAndUniquelyClaimsNicknames() {
		ChatController controller = new ChatController(new RecordingSseEventBus());

		assertThat(controller.signin(" Alice ")).isEqualTo("1");
		assertThat(controller.signin("Alice")).isNull();
		assertThat(controller.signin("  ")).isNull();

		controller.unregisterClient(new ClientUnregisterEvent("1"));

		assertThat(controller.signin("Alice")).isEqualTo("2");
	}

	@Test
	void validatesRoomsAndPublishesTypedMessages() {
		RecordingSseEventBus eventBus = new RecordingSseEventBus();
		ChatController controller = new ChatController(eventBus);
		String clientId = controller.signin("Alice");

		assertThat(controller.addRoom(" Lounge ")).isTrue();
		assertThat(controller.addRoom("Lounge")).isFalse();
		Room room = controller.subscribe(clientId).getFirst();
		assertThat(room.name()).isEqualTo("Lounge");

		eventBus.events.clear();
		controller.sendMessage(new ClientRequest(clientId, room.id(), " Hello "));

		assertThat(eventBus.events).hasSize(1);
		SseEvent event = eventBus.events.getFirst();
		assertThat(event.event()).isEqualTo(room.id());
		List<?> data = (List<?>) event.data();
		assertThat(data).hasSize(1);
		Message message = (Message) data.getFirst();
		assertThat(message.type()).isEqualTo(MessageType.MSG);
		assertThat(message.user()).isEqualTo("Alice");
		assertThat(message.message()).isEqualTo("Hello");

		controller.sendMessage(new ClientRequest(clientId, "missing", "ignored"));
		assertThat(eventBus.events).hasSize(1);
	}

	@Test
	void publishesLifecycleCleanupEvents() {
		List<Object> events = new ArrayList<>();
		SseEventBusConfiguration configuration = new SseEventBusConfiguration(events::add);

		configuration.listener().afterClientsUnregistered(Set.of("client-1"));

		assertThat(events).containsExactly(new ClientUnregisterEvent("client-1"));
		assertThat(configuration.heartbeatInterval()).isEqualTo(Duration.ofSeconds(15));
	}

	private static final class RecordingSseEventBus extends SseEventBus {

		private final List<SseEvent> events = new ArrayList<>();

		private RecordingSseEventBus() {
			super(new SseEventBusConfigurer() {
				@Override
				public ScheduledExecutorService taskScheduler() {
					return null;
				}
			}, new DefaultSubscriptionRegistry(), List.of(), null);
		}

		@Override
		public void handleEvent(SseEvent event) {
			this.events.add(event);
		}

	}

}
