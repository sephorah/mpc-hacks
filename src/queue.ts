import { Case } from "./types";

export type QueueCategory = "sync" | "async";

interface QueueItem {
  caseObj: Case;
  addedAt: number;
}

class Queue {
  private syncQueue: QueueItem[] = [];
  private asyncQueue: QueueItem[] = [];

  enqueue(caseObj: Case, category: QueueCategory): void {
    const item: QueueItem = { caseObj, addedAt: Date.now() };
    if (category === "sync") {
      this.syncQueue.push(item);
    } else {
      this.asyncQueue.push(item);
    }
  }

  dequeue(category: QueueCategory): QueueItem | undefined {
    if (category === "sync") {
      return this.syncQueue.shift();
    } else {
      return this.asyncQueue.shift();
    }
  }

  peek(category: QueueCategory): QueueItem | undefined {
    if (category === "sync") {
      return this.syncQueue[0];
    } else {
      return this.asyncQueue[0];
    }
  }

  length(category: QueueCategory): number {
    if (category === "sync") {
      return this.syncQueue.length;
    } else {
      return this.asyncQueue.length;
    }
  }

  getAll(category: QueueCategory): QueueItem[] {
    if (category === "sync") {
      return [...this.syncQueue];
    } else {
      return [...this.asyncQueue];
    }
  }

  clear(category: QueueCategory): void {
    if (category === "sync") {
      this.syncQueue = [];
    } else {
      this.asyncQueue = [];
    }
  }
}

export const queue = new Queue();
