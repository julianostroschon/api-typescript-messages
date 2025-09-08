import { cfg, parentLogger } from '@/infra';
import { startServer } from '@/services';
import { setupGracefulShutdown } from '@/utils';
import { startRabbitProducer } from './rabbit';

const logger = parentLogger.child({ service: 'producer-app' });

async function main(): Promise<void> {
  const isRabbitEnabled = !!(cfg.RABBITMQ_URL && cfg.RABBITMQ_URL.length > 0);

  const app = await startServer(!isRabbitEnabled, parentLogger);

  if (isRabbitEnabled) {
    logger.info('🐰 RabbitMQ is enabled');
    const channel = await startRabbitProducer();
    setupGracefulShutdown([
      async (): Promise<void> => {
        logger.info('Closing RabbitMQ connection...');
        await channel.close();
      },
      async (): Promise<void> => {
        logger.info('Closing Fastify server...');
        await app.close();
      },
    ])
  }
  logger.info('RabbitMQ enabled status:', { isRabbitEnabled });
  setupGracefulShutdown([
    async (): Promise<void> => {
      logger.info('Closing Fastify server...');
      await app.close();
    },
  ])
}

main().catch((err: Error | null): never => {
  logger.error(err?.message || 'Unknown error');
  process.exit(1);
});
