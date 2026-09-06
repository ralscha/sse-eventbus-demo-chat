package ch.rasc.eventbus.demo.chat;

import java.time.Duration;
import java.util.Set;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Configuration;

import ch.rasc.sse.eventbus.SseEventBusListener;
import ch.rasc.sse.eventbus.config.SseEventBusConfigurer;

@Configuration
public class SseEventBusConfiguration implements SseEventBusConfigurer {

	private final ApplicationEventPublisher eventPublisher;

	public SseEventBusConfiguration(ApplicationEventPublisher eventPublisher) {
		this.eventPublisher = eventPublisher;
	}

	@Override
	public Duration clientExpiration() {
		return Duration.ofHours(1);
	}

	@Override
	public Duration heartbeatInterval() {
		return Duration.ofSeconds(15);
	}

	@Override
	public SseEventBusListener listener() {
		return new SseEventBusListener() {
			@Override
			public void afterClientsUnregistered(Set<String> clientIds) {
				clientIds.forEach(clientId -> SseEventBusConfiguration.this.eventPublisher
					.publishEvent(new ClientUnregisterEvent(clientId)));
			}
		};
	}

}
