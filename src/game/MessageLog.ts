import { COLORS, UI } from "./constants/common";
import type { Message, MessageLine } from "./types";

export function getIndefiniteArticle(word: string): "a" | "an" {
  const firstChar = word.trim().charAt(0).toLowerCase();
  return ["a", "e", "i", "o", "u"].includes(firstChar) ? "an" : "a";
}

export class MessageLog {
  private messages: Message[] = [];

  public showMessage(
    arg: string | MessageLine | Array<string | MessageLine>,
    color: string = COLORS.WHITE,
  ): void {
    const rawLines = Array.isArray(arg) ? arg : [arg];
    const lines: MessageLine[] = rawLines.map((line) =>
      typeof line === "string" ? { text: line } : line,
    );

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
