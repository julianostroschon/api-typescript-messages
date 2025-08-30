import { Channel, connect, type ConsumeMessage } from 'amqplib';

import { cfg, parentLogger } from '@/infra';
import { MessageServices, sendMessage } from '@/services';
import { consumer } from './constants';

const logger = parentLogger.child({ service: 'consumer-rabbit' });

interface MessageContent {
  to: string;
  message: string;
}

export async function startRabbitConsumer(): Promise<Channel> {
  const isRabbitEnabled = !!(cfg.RABBITMQ_URL && cfg.RABBITMQ_URL.length > 0);
  if (!isRabbitEnabled || !cfg.RABBITMQ_URL) {
    throw new Error('❌ RabbitMQ URL is not configured.');
  }
  const consumerTag = consumer.tag();
  const connection = await connect(cfg.RABBITMQ_URL).catch((err) => {
    logger.error(`❌ Erro ao conectar ao RabbitMQ`, { error: err.message });
    throw err;
  });
  const channel = await connection.createChannel();

  await channel.assertQueue(consumer.queue, { durable: true });
  await channel.assertExchange(consumer.exchange, 'direct', { durable: true });
  await channel.bindQueue(consumer.queue, consumer.exchange, cfg.ROUTINE_NEW_MESAGE).catch((err) => {
    logger.error(`❌ Erro ao bindar fila à exchange`, { error: err.message });
  });

  logger.info(`👷 Worker criado, aguardando mensagens do exchange "${consumer.exchange}"`, { queue: consumer.queue });

  channel.consume(consumer.queue, async (message: ConsumeMessage | null): Promise<void> => {
    if (message) {
      try {
        const content = JSON.parse(message.content.toString()) as MessageContent;
        if (!content.to || !content.message) {
          logger.error(`❌ Mensagem inválida recebida`, { content });
          return channel.nack(message, false, false);
        }

        logger.info(`📥 Processando mensagem`, {
          to: content.to,
          messageLength: content.message.length
        });

        const body = { to: content.to, message: content.message }
        await sendMessage(MessageServices.Telegram, body);

        channel.ack(message);

      } catch (err) {
        logger.error(`❌ Erro ao processar mensagem`, {
          error: err instanceof Error ? err.message : 'Erro desconhecido',
          content: message.content.toString()
        });
        channel.nack(message, false, false);
      }
    }
  }, { consumerTag });

  return channel;
}
