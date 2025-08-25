import { cfg } from '@/infra';
import { sendTelegramMessage } from '@/services/telegram';
import { Channel, connect, Connection } from 'amqplib';

jest.mock('amqplib');

// Unificar todos os exports do módulo infra em um único mock
jest.mock('@/infra', () => ({
  cfg: {
    RABBITMQ_URL: 'amqp://localhost',
    ROUTINE_NEW_MESAGE: 'new-message',
    TELEGRAM_TOKEN: 'token'
  },
}));

// Mock explícito para manter shape do módulo de mensagens
jest.mock('@/services/messages', () => ({
  MessageServices: { Telegram: 'TELEGRAM' },
  sendMessage: jest.fn()
}));

let mockChannel: jest.Mocked<Channel>;
let mockConnection: jest.Mocked<Connection>;

beforeEach(() => {
  mockChannel = {
    assertQueue: jest.fn().mockResolvedValue({}),
    assertExchange: jest.fn().mockResolvedValue({}),
    bindQueue: jest.fn().mockResolvedValue({}),
    consume: jest.fn().mockResolvedValue({}),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn()
  } as unknown as jest.Mocked<Channel>;

  mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn()
  } as unknown as jest.Mocked<Connection>;

  (connect as jest.Mock).mockResolvedValue(mockConnection);
});

describe('RabbitMQ Consumer', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.only('should initialize rabbitmq consumer correctly', async () => {
    await sendTelegramMessage('21', 'oito');

    expect(connect).toHaveBeenCalledWith(cfg.RABBITMQ_URL);
    expect(mockChannel.assertQueue).toHaveBeenCalledTimes(1);
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('input', { durable: true });
    expect(mockChannel.assertExchange).toHaveBeenCalledTimes(1);
    expect(mockChannel.assertExchange).toHaveBeenCalledWith('reader', 'direct', { durable: true });
    expect(mockChannel.bindQueue).toHaveBeenCalledTimes(1);
    expect(mockChannel.bindQueue).toHaveBeenCalledWith('input', 'reader', 'new-message');
    expect(mockChannel.consume).toHaveBeenCalledTimes(1);
    expect(mockChannel.consume).toHaveBeenCalledWith('input', expect.any(Function), { consumerTag: 'consumer-tag' });
  });
});