package ch.rasc.eventbus.demo.chat;

public class Message {
	private MessageType type;
	private String user;
	private String message;
	private long sendDate;

	public MessageType getType() {
		return this.type;
	}

	public void setType(MessageType type) {
		this.type = type;
	}

	public String getUser() {
		return this.user;
	}

	public void setUser(String user) {
		this.user = user;
	}

	public String getMessage() {
		return this.message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public long getSendDate() {
		return this.sendDate;
	}

	public void setSendDate(long sendDate) {
		this.sendDate = sendDate;
	}

}
