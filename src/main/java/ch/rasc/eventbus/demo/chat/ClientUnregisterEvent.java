package ch.rasc.eventbus.demo.chat;

public class ClientUnregisterEvent {
	private final String clientId;

	public ClientUnregisterEvent(String clientId) {
		this.clientId = clientId;
	}

	public String getClientId() {
		return this.clientId;
	}

}
