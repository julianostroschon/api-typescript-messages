import { buildConsumerTag } from "@/services"

export const consumer = {
  queue: 'submit-messages',
  exchange: 'submit-exchange',
  tag: function (): string {
    return buildConsumerTag(this.queue)
  }
}