export interface QueueJob {
  name: string;
  payload: Record<string, unknown>;
}

export class QueueService {
  enqueue(_job: QueueJob): void {
    // TODO: implement queue producer
  }

  async process(): Promise<void> {
    // TODO: implement queue consumer
  }
}

export const queueService = new QueueService();
