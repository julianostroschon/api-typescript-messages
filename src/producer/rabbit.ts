import { connect, ConsumeMessage, type Channel } from 'amqplib';

import { consumer } from '@/consumer/constants';
import { cfg, parentLogger } from '@/infra';
import { producer } from './constants';

let producerChannel: Channel;
const logger = parentLogger.child({ service: 'producer' });


export async function startRabbitProducer(): Promise<Channel> {
  const consumerTag = producer.tag();
  const connection = await connect(cfg.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(producer.queue, { durable: true });
  await channel.assertExchange(producer.exchange, 'direct', { durable: true });
  await channel.bindQueue(producer.queue, producer.exchange, cfg.ROUTINE_NEW_MESAGE);

  logger.info(`👷 Worker criado, aguardando mensagens`, { queue: producer.queue });

  channel.consume(producer.queue, async (msg: ConsumeMessage | null) => onProducerMessage(msg, channel), { consumerTag });

  producerChannel = channel

  return channel;
}

async function onProducerMessage(consumeMessage: ConsumeMessage | null, channel: Channel): Promise<void> {
  if (!consumeMessage) return
  try {
    const content = JSON.parse(consumeMessage.content.toString());
    const { to, message } = content

    if (!to || !message) {
      logger.error(`❌ Mensagem recebida inválida`, { content });
      return channel.nack(consumeMessage, false, false);
    }

    logger.info(`📥 Processando mensagem`, {
      messageLength: message.length,
      to: to,
    });

    await publishMessage(to, message);

    channel.ack(consumeMessage);

  } catch (err) {
    logger.error(`❌ Erro ao processar mensagem`, {
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      content: consumeMessage.content.toString()
    });
    channel.nack(consumeMessage, false, false);
  }
}


export async function publishMessage(to: string, message: string): Promise<void> {
  if (!producerChannel) {
    await startRabbitProducer()
  }

  const content = Buffer.from(JSON.stringify({ to, message }));

  try {
    const success = producerChannel.publish(consumer.exchange, cfg.ROUTINE_NEW_MESAGE, content, {
      persistent: true
    });

    if (success) {
      logger.info(`📤 Mensagem enviada para exchange "${consumer.exchange}"`, {
        messageLength: message.length,
        to,
      });
      return
    }
    logger.warn(`⚠️ Mensagem não foi confirmada pelo RabbitMQ`, { to });
  } catch (error) {
    logger.error(`❌ Erro ao enviar mensagem para exchange:`, error);
    throw error;
  }
}
