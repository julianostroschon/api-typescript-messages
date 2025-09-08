import { parentLogger } from '@/infra';
import { cleanupTelegramBot, initializeTelegramBot } from '@/services/telegram';
import { setupGracefulShutdown } from '@/utils';
import { startRabbitConsumer } from './rabbit';

const logger = parentLogger.child({ service: 'consumer' });

async function main(): Promise<void> {
  initializeTelegramBot();

  const channel = await startRabbitConsumer();

  setupGracefulShutdown([
    async (): Promise<void> => {
      cleanupTelegramBot();
    },
    async (): Promise<void> => {
      logger.info('Closing RabbitMQ connection...');
      await channel.close();
    },
  ]);
}

main().catch((err: Error | null) => {
  logger.error(err?.message);
  process.exit(0);
});
