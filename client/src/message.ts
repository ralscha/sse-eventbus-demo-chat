export interface Message {
  sendDate?: Date;
  user: string;
  type?: 'JOIN' | 'LEAVE' | 'MSG';
  message: string;
}

