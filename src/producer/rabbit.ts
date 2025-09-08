import { connect, ConsumeMessage, type Channel } from 'amqplib';

import { consumer } from '@/consumer/constants';
import { cfg, parentLogger } from '@/infra';
import { MessageServices, sendMessage } from '@/services';
import { producer } from './constants';

let producerChannel: Channel;
const logger = parentLogger.child({ service: 'producer' });


export async function startRabbitProducer(): Promise<Channel> {
  if (!cfg.RABBITMQ_URL) {
    throw new Error('❌ RabbitMQ URL is not configured.');
  }
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
      logger.error(`❌ Invalid message received`, { content });
      return channel.nack(consumeMessage, false, false);
    }

    logger.info(`📥 Processing message`, {
      messageLength: message.length,
      to: to,
    });

    const isRabbitEnabled = !!(cfg.RABBITMQ_URL && cfg.RABBITMQ_URL.length > 0);
    await publishMessage(to, message, !isRabbitEnabled);

    channel.ack(consumeMessage);

  } catch (err) {
    logger.error(`❌ Error processing message`, {
      error: err instanceof Error ? err.message : 'Unknown error',
      content: consumeMessage.content.toString()
    });
    channel.nack(consumeMessage, false, false);
  }
}


export async function publishMessage(to: string, message: string, isAlone: boolean): Promise<void> {
  if (isAlone) {
    let isFirstAttempt = true
    if (isFirstAttempt) logger.warn('⚠️ RabbitMQ is not enabled, sending message directly', { to });
    await sendMessage(MessageServices.Telegram, { to, message });
    isFirstAttempt = false
    return
  }
  if (!cfg?.RABBITMQ_URL) {
    throw new Error('❌ RabbitMQ URL is not configured.');
  }
  if (!producerChannel) {
    await startRabbitProducer();
  }

  const content = Buffer.from(JSON.stringify({ to, message }));

  try {
    const success = producerChannel.publish(consumer.exchange, cfg.ROUTINE_NEW_MESAGE, content, {
      persistent: true
    });

    if (success) {
      logger.info(`📤 Message sent to exchange "${consumer.exchange}"`, {
        messageLength: message.length,
        to,
      });
      return
    }
    logger.warn(`⚠️ Message not confirmed by RabbitMQ`, { to });
  } catch (error) {
    logger.error(`❌ Error sending message to exchange:`, error);
    throw error;
  }
}
