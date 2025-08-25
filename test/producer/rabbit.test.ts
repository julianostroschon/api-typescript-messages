import { Channel, connect, Connection } from 'amqplib';
import { cfg } from '../../src/infra';
import { startRabbitProducer } from '../../src/producer/rabbit';
import { MessageServices, sendMessage } from '../../src/services/messages';

jest.mock('amqplib');

// Unificar todos os exports do módulo infra em um único mock
jest.mock('../../src/infra', () => ({
  cfg: {
    RABBITMQ_URL: 'amqp://localhost',
    ROUTINE_NEW_MESAGE: 'new-message'
  },
  parentLogger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  },
  packageInfo: {
    version: '1.0.0',
    name: 'oito'
  }
}));

// Mock explícito para manter shape do módulo de mensagens
jest.mock('../../src/services/messages', () => ({
  MessageServices: { Telegram: 'TELEGRAM' },
  sendMessage: jest.fn()
}));
jest.mock('../../src/producer/constants', () => ({
  producer: { queue: 'input', exchange: 'reader', tag: jest.fn().mockReturnValueOnce('consumer-tag') },
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

  // const mockLoggerChild = {
  //   info: jest.fn(),
  //   warn: jest.fn(),
  //   error: jest.fn()
  // };

  // mockParentLogger = {
  //   child: jest.fn().mockReturnValue(mockLoggerChild),
  //   info: jest.fn(),
  //   warn: jest.fn(),
  //   error: jest.fn()
  // } as unknown as jest.Mocked<Logger>;
});
describe('RabbitMQ Consumer', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.only('should initialize rabbitmq consumer correctly', async () => {
    await startRabbitProducer();

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

  it('should process valid messages correctly', async () => {
    const mockMessage = {
      content: Buffer.from(JSON.stringify({
        to: '123456',
        message: 'test message'
      })),
    };

    (sendMessage as jest.Mock).mockResolvedValueOnce({ status: 'queued' });

    await startRabbitProducer();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    await consumeCallback(mockMessage as any);

    expect(sendMessage).toHaveBeenCalledWith(
      MessageServices.Telegram,
      expect.objectContaining({
        to: '123456',
        message: 'test message'
      })
    );
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  it('should handle invalid messages', async () => {
    const mockMessage = {
      content: Buffer.from(JSON.stringify({})),
    };

    await startRabbitProducer();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    await consumeCallback(mockMessage as any);

    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, false);
  });

  it('should handle message processing errors', async () => {
    const mockMessage = {
      content: Buffer.from(JSON.stringify({
        to: '123456',
        message: 'test message'
      })),
    };

    (sendMessage as jest.Mock).mockRejectedValueOnce(new Error('Processing error'));

    await startRabbitProducer();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    await consumeCallback(mockMessage as any);

    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, false);
  });
});