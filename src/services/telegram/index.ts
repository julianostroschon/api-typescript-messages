import TelegramBot, { ConstructorOptions, Message, SendMessageOptions } from 'node-telegram-bot-api';

import { isTesting } from '@/constants';
import { cfg, parentLogger } from '@/infra';

const logger = parentLogger.child({ service: 'telegram' });
const options: SendMessageOptions = { parse_mode: 'Markdown' };

let bot: TelegramBot | null = null;

function initBot(): TelegramBot {
  const botOptions: ConstructorOptions = {
    polling: !isTesting ? {
      interval: 300,
      autoStart: true,
      params: {
        timeout: 10
      }
    } : false
  }
  return new TelegramBot(cfg.TELEGRAM_TOKEN, botOptions);
}

function getBot(): TelegramBot {
  if (!bot) {
    bot = initBot();

    // Only set up message handlers in non-test environment
    if (!isTesting) {
      bot.onText(/\/start/, (msg: Message): void => {
        logger.info('Command /start received from:', { chatId: msg.chat.id, user: msg.from?.username });
        const chatId = msg.chat.id;
        bot?.sendMessage(chatId, chatId.toString(), {
          ...options,
          reply_to_message_id: msg.message_id
        })
          .then((): void => {
            logger.info(`🤖 Automatic response sent to chatId: ${chatId}`);
          })
          .catch((error: unknown): void => {
            logger.error(`❌ Error sending automatic response to chatId ${chatId}:`, error);
          });
      });

      logger.info('🤖 Telegram bot initialized with message monitoring');
    } else {
      logger.info('🤖 Telegram bot initialized in test mode (no polling)');
    }
  }
  return bot;
}

export async function sendTelegramMessage(chatId: string | number, text: string, opts: SendMessageOptions = options): Promise<{ status: string }> {
  try {
    const botInstance = getBot();

    if (!chatId || isNaN(Number(chatId))) {
      throw new Error(`Invalid chatId: ${chatId}`);
    }

    await botInstance.sendMessage(chatId, text, opts);

    logger.info(`✅ Message sent successfully to chatId: ${chatId}`);
    return { status: 'queued' };
  } catch (error) {
    logger.error(`❌ Error sending message to chatId ${chatId}:`, error);
    throw error;
  }
}

export function initializeTelegramBot(): void {
  logger.info('🚀 Initializing Telegram bot...');
  getBot(); // This will create the bot and set up listeners
}

export function cleanupTelegramBot(): void {
  if (bot) {
    bot.close();
    bot = null;
    logger.info('🧹 Telegram bot closed');
  }
}
