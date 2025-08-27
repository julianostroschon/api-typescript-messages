import { publishMessage } from '@/producer/rabbit';
import { buildFastify } from '@/services/http';
import { FastifyInstance } from 'fastify';

jest.mock('@/producer/rabbit', () => ({
  publishMessage: jest.fn()
}));

describe('Fastify server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildFastify();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/.ping', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/.ping',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ hello: 'world' });
  });

  it('/api/v1/send, erro missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/send',
      body: {
        to: '9090',
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      status: "fail",
      message: "Missing 'to' or 'messsage' fields",
      err: "Missing required fields!"
    });
  });

  it('/api/v1/send, successfully publishMessage', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/send',
      body: {
        to: '9090',
        message: 'oito'
      }
    });

    expect(publishMessage).toHaveBeenCalledTimes(1)
    expect(publishMessage).toHaveBeenCalledWith('9090', 'oito')

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "queued",
    });
  });
});
