import { Case } from "./types";

export type QueueCategory = "sync" | "async";

interface QueueItem {
  caseObj: Case;
  addedAt: number;
}

export class Queue {
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

  get(id: string): QueueItem | undefined {
    for (const item of this.syncQueue) {
        if (item.caseObj.id == id) {
            return item;
        }
    }
        for (const item of this.asyncQueue) {
        if (item.caseObj.id == id) {
            return item;
        }
    }
  }

  close(item: QueueItem) {
    throw "Unimplemented";
  }

  clear(category: QueueCategory): void {
    if (category === "sync") {
      this.syncQueue = [];
    } else {
      this.asyncQueue = [];
    }
  }
}