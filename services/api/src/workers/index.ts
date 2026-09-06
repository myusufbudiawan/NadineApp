export type BackgroundJob = {
  name: 'sync' | 'report-generation' | 'notification-scheduling';
  payload: Record<string, unknown>;
};
export interface JobQueue {
  enqueue(job: BackgroundJob): Promise<void>;
}
export class InProcessJobQueue implements JobQueue {
  async enqueue(_job: BackgroundJob) {
    /* replace with durable worker transport before production */
  }
}
