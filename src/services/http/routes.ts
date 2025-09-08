import { MessageServices, sendMessage } from '@/services';
import { FastifyInstance } from "fastify";
import { verify } from "jsonwebtoken";
import { Logger } from "winston";

import { HTTP_STATUS, URL_PREFIX } from "@/constants";
import { cfg } from "@/infra";
import { publishMessage } from "@/producer/rabbit";

export async function constructRoutes(
  app: FastifyInstance,
  logger: Logger,
  isAlone: boolean
): Promise<void> {

  app.post(`${URL_PREFIX}send`, async (req, reply) => {
    try {
      logger.info('📥 Received request', { body: req.body });

      const body = (req.body as unknown as { token: string });
      if (!body.token) {
        logger.warn('Missing token');
        return reply.status(HTTP_STATUS.ERROR.BAD_USER_INPUT).send({
          message: "Token is not found",
          status: "fail",
        });
      }
      const tokenCleaned = decode<{ to: string, message: string }>(body.token)
      if (!tokenCleaned.to || !tokenCleaned.message) {
        logger.warn('Missing required fields');
        return reply.status(HTTP_STATUS.ERROR.BAD_USER_INPUT).send({
          message: "Missing 'to' or 'messsage' fields",
          err: "Missing required fields!",
          status: "fail",
        });
      }

      const { to, message } = tokenCleaned;
      if (!isAlone) {
        logger.info(`📤 Routing message to RabbitMQ queue (queued mode) for chatId: ${to}`);
        await publishMessage(to, message, isAlone);
        return reply.status(HTTP_STATUS.SUCCESS).send({
          status: "queued",
        });
      }
      logger.info(`📦 Sending message directly to Telegram (direct mode) for chatId: ${to}`);
      const { status } = await sendMessage(MessageServices.Telegram, { to, message });
      return reply.status(HTTP_STATUS.SUCCESS).send({
        message: "Service running in isolated mode, message submited.",
        status
      });
    } catch (error) {
      logger.error('❌ Error processing request:', error);
      return reply.status(HTTP_STATUS.ERROR.SERVER_INTERNAL).send({
        status: "fail",
        message: "Internal server error",
        err: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.post(`${URL_PREFIX}clean`, async (req, reply) => {
    try {
      logger.info('📥 Received request', { body: req.body });

      const body = (req.body as unknown as { to: string, message: string });

      if (!body.to || !body.message) {
        logger.warn('Missing required fields');
        return reply.status(HTTP_STATUS.ERROR.BAD_USER_INPUT).send({
          message: "Missing 'to' or 'messsage' fields",
          err: "Missing required fields!",
          status: "fail",
        });
      }

      const { to, message } = body;
      logger.info(`📤 Routing clean message to RabbitMQ queue for chatId: ${to}`);
      await publishMessage(to, message, isAlone);
      return reply.status(HTTP_STATUS.SUCCESS).send({
        status: "queued",
      });
    } catch (error) {
      logger.error('❌ Error processing request:', error);
      return reply.status(HTTP_STATUS.ERROR.SERVER_INTERNAL).send({
        status: "fail",
        message: "Internal server error",
        err: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

function decode<T>(token: string): T {
  return verify(
    token,
    cfg.JWT_SECRET
  ) as T;
};

