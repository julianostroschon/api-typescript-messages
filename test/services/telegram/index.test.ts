import { sendTelegramMessage } from '@/services/telegram';
import { Channel, connect, Connection } from 'amqplib';

jest.mock('amqplib');

// Criamos uma classe fake para simular o construtor do TelegramBot
const mockSendMessage = jest.fn().mockResolvedValue({});
const mockOnText = jest.fn();

jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    onText: mockOnText,
    sendMessage: mockSendMessage,
    close: jest.fn()
  }));
});

// Mock do módulo infra
jest.mock('@/infra', () => ({
  cfg: {
    ROUTINE_NEW_MESAGE: 'new-message',
    RABBITMQ_URL: 'amqp://localhost',
    TELEGRAM_TOKEN: 'fake-token'
  },
  parentLogger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

// Mock do módulo de mensagens (se for usado em outro fluxo)
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

  jest.clearAllMocks();
});

describe('Telegram service', (): void => {
  it('Start bot and send message', async (): Promise<void> => {
    const chatId = '12345';
    const text = 'mensagem de teste';

    expect(sendTelegramMessage(chatId, text)).resolves.toEqual({ status: 'queued' });

    expect(mockSendMessage).toHaveBeenCalledWith(chatId, text, expect.any(Object));
  });

  it('deve lançar erro quando chatId for inválido', async (): Promise<void> => {
    await expect(sendTelegramMessage('invalid-id', 'teste'))
      .rejects
      .toThrow('ChatId inválido');
  });
});
