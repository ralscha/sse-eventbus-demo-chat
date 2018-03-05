package ch.rasc.eventbus.demo.chat;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import ch.rasc.sse.eventbus.DefaultSubscriptionRegistry;

@Component
public class CustomSubscriptionRegistry extends DefaultSubscriptionRegistry {
	private final ApplicationEventPublisher eventPublisher;

	public CustomSubscriptionRegistry(ApplicationEventPublisher eventPublisher) {
		this.eventPublisher = eventPublisher;
	}

	@Override
	public void unsubscribe(String clientId, String event) {
		super.unsubscribe(clientId, event);

		if (event.equals("roomAdded")) {
			this.eventPublisher.publishEvent(new ClientUnregisterEvent(clientId));
		}
	}

}