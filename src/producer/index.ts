import { cfg, parentLogger } from '@/infra';
import { cleanupTelegramBot, initializeTelegramBot, startServer } from '@/services';
import { setupGracefulShutdown } from '@/utils';

import { startRabbitProducer } from './rabbit';

const logger = parentLogger.child({ service: 'producer-app' });

async function main(): Promise<void> {
  const isRabbitEnabled = !!(cfg.RABBITMQ_URL && cfg.RABBITMQ_URL.length > 0);
  const app = await startServer(!isRabbitEnabled, parentLogger);

  if (isRabbitEnabled) {
    logger.info('🐰 RabbitMQ enabled - Telegram bot will be handled by consumer');
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
    return
  }
  logger.info('🤖 Initializing Telegram bot for direct message delivery');
  initializeTelegramBot();
  // Cleanup for direct mode (when RabbitMQ is disabled)
  setupGracefulShutdown([
    async (): Promise<void> => {
      cleanupTelegramBot();
    },
    async (): Promise<void> => {
      logger.info('Closing Fastify server...');
      await app.close();
    },
  ]);

}

main().catch((err: Error | null): never => {
  logger.error(err?.message || 'Unknown error');
  process.exit(1);
});
