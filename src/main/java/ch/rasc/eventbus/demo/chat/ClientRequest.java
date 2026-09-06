package ch.rasc.eventbus.demo.chat;

public record ClientRequest(String clientId, String roomId, String message) {
}
