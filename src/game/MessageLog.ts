import { COLORS, UI } from "./constants/common";
import type { Message } from "./types";

export class MessageLog {
  private messages: Message[] = [];

  // Add a message to the bottom of the message log,
  // and remove the oldest message if the log exceeds the maximum height
  public showMessage(text: string, color: string = COLORS.WHITE): void {
    const message: Message = { text, color };
    this.messages.push(message);
    if (this.messages.length > UI.MESSAGE_LOG_HEIGHT) {
      this.messages.shift();
    }
  }

  // Clear all messages from the message log
  public clearMessages(): void {
    this.messages = [];
  }

  // Get the current messages in the message log
  public getMessages(): Message[] {
    return [...this.messages];
  }
}
