import { COLORS, UI } from "./constants/common";
import type { Message } from "./types";

export class MessageLog {
  private messages: Message[] = [];

  public showMessage(arg: string | string[], color: string = COLORS.WHITE): void {
    const lines = Array.isArray(arg) ? arg : [arg];
    this.messages.push({ lines, color });
    while (this.messageLineCount() > UI.MESSAGE_LOG_HEIGHT * 2) {
      this.messages.shift();
    }
  }

  private messageLineCount(): number {
    return this.messages.reduce((count, message) => count + message.lines.length, 0);
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
