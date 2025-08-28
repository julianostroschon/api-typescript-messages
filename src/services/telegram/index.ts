import TelegramBot, { ConstructorOptions, Message, SendMessageOptions } from 'node-telegram-bot-api';

import { cfg, parentLogger } from '@/infra';

const logger = parentLogger.child({ service: 'telegram' });
const options: SendMessageOptions = { parse_mode: 'Markdown' };

let bot: TelegramBot | null = null;

function initBot(): TelegramBot {
  const botOptions: ConstructorOptions = {
    polling: {
      interval: 300,
      autoStart: true,
      params: {
        timeout: 10,
        offset: -1
      }
    }
  }
  return new TelegramBot(cfg.TELEGRAM_TOKEN, botOptions);
}

function getBot(): TelegramBot {
  if (!bot) {
    bot = initBot()

    bot.onText(/\/start/, (msg: Message): void => {
      logger.info('Comando /start detectado!');
      const chatId = msg.chat.id;
      const text = 'Seu Chat Id:`' + chatId + '`'
      bot?.sendMessage(chatId, text, {
        ...options,
        reply_to_message_id: msg.message_id
      })
        .then((): void => {
          logger.info(`🤖 Resposta automática enviada para chatId: ${chatId}`);
        })
        .catch((error: unknown): void => {
          logger.error(`❌ Erro ao enviar resposta automática para chatId ${chatId}:`, error);
        });
    });

    logger.info('🤖 Bot do Telegram inicializado com monitoramento de mensagens');
  }
  return bot;
}

export async function sendTelegramMessage(chatId: string | number, text: string, opts: SendMessageOptions = options): Promise<{ status: string }> {
  try {
    const botInstance = getBot();

    if (!chatId || isNaN(Number(chatId))) {
      throw new Error(`ChatId inválido: ${chatId}`);
    }

    await botInstance.sendMessage(chatId, text, opts);

    logger.info(`✅ Mensagem enviada com sucesso para chatId: ${chatId}`);
    return { status: 'queued' };
  } catch (error) {
    logger.error(`❌ Erro ao enviar mensagem para chatId ${chatId}:`, error);
    throw error;
  }
}

export function cleanupTelegramBot(): void {
  if (bot) {
    bot.close();
    bot = null;
    logger.info('🧹 Bot do Telegram encerrado');
  }
}
