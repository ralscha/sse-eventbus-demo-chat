package ch.rasc.eventbus.demo.chat;

public record Message(MessageType type, String user, String message, long sendDate) {
}
