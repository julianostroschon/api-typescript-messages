const mockFormat = {
  combine: jest.fn().mockReturnThis(),
  timestamp: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  colorize: jest.fn().mockReturnThis(),
  simple: jest.fn().mockReturnThis(),
};

const mockLogger = {
  level: 'info',
  add: jest.fn(),
  child: jest.fn().mockImplementation(() => mockLogger),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

export default {
  format: mockFormat,
  createLogger: jest.fn().mockReturnValue(mockLogger),
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
};