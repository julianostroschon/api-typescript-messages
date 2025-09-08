import { cfg, parentLogger } from '@/infra';
import { startServer } from '@/services';
import { cleanupTelegramBot, initializeTelegramBot } from '@/services/telegram';
import { setupGracefulShutdown } from '@/utils';
import { startRabbitProducer } from './rabbit';

const logger = parentLogger.child({ service: 'producer-app' });

async function main(): Promise<void> {
  const isRabbitEnabled = !!(cfg.RABBITMQ_URL && cfg.RABBITMQ_URL.length > 0);

  // Initialize Telegram bot to start listening for messages
  initializeTelegramBot();

  const app = await startServer(!isRabbitEnabled, parentLogger);

  if (isRabbitEnabled) {
    logger.info('🐰 RabbitMQ is enabled');
    const channel = await startRabbitProducer();
    setupGracefulShutdown([
      async (): Promise<void> => {
        cleanupTelegramBot();
      },
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
  setupGracefulShutdown([
    async (): Promise<void> => {
      cleanupTelegramBot();
    },
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
