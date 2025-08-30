import { cfg, parentLogger } from '@/infra';
import { startServer } from '@/services';
import { setupGracefulShutdown } from '@/utils';
import { startRabbitProducer } from './rabbit';

const logger = parentLogger.child({ service: 'producer-app' });

async function main(): Promise<void> {
  const isRabbitEnabled = !!(cfg.RABBITMQ_URL && cfg.RABBITMQ_URL.length > 0);
  const app = await startServer(!isRabbitEnabled);
  const inputs: { close: () => Promise<void> }[] = [app]
  if (isRabbitEnabled) {
    const channel = await startRabbitProducer();
    inputs.push(channel);
  }

  setupGracefulShutdown(inputs.map(i => i.close.bind(i)));
}

main().catch((err: Error | null): never => {
  logger.error(err?.message || 'Unknown error');
  process.exit(1);
});
