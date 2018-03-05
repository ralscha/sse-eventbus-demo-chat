package ch.rasc.eventbus.demo.chat;

import java.time.Duration;

import org.springframework.context.annotation.Configuration;

import ch.rasc.sse.eventbus.config.SseEventBusConfigurer;

@Configuration
public class SseEventBusConfiguration implements SseEventBusConfigurer {

	@Override
	public Duration clientExpiration() {
		return Duration.ofHours(1);
	}

}
