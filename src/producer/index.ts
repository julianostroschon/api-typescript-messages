import { parentLogger } from '@/infra';
import { buildFastify } from '@/services';
import { setupGracefulShutdown } from '@/utils';
import { startRabbitProducer } from './rabbit';

const logger = parentLogger.child({ service: 'producer-app' });

async function main(): Promise<void> {
  const channel = await startRabbitProducer();

  const app = await buildFastify();

  setupGracefulShutdown([
    async (): Promise<void> => {
      logger.info('Closing RabbitMQ connection...');
      await channel.close();
    },
    async (): Promise<void> => {
      logger.info('Closing Fastify server...');
      await app.close();
    },
  ]);
}

main().catch((err: Error | null): never => {
  logger.error(err);
  process.exit(1);
});
