package ch.rasc.eventbus.demo.chat;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import ch.rasc.sse.eventbus.SseEventBus;

@Controller
@CrossOrigin
public class SseController {

	private final SseEventBus eventBus;

	public SseController(SseEventBus eventBus) {
		this.eventBus = eventBus;
	}

	@GetMapping("/register/{clientId}")
	public SseEmitter register(@PathVariable("clientId") String clientId,
			HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		response.setHeader("X-Accel-Buffering", "no");
		return this.eventBus.createSseEmitter(clientId, 180_000L);
	}

}
