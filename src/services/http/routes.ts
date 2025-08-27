import { FastifyInstance } from "fastify";
import { Logger } from "winston";

import { HTTP_STATUS, URL_PREFIX } from "@/constants";
import { publishMessage } from "@/producer/rabbit";

export async function constructRoutes(
  app: FastifyInstance,
  logger: Logger
): Promise<void> {

  app.post(`${URL_PREFIX}send`, async (req, reply) => {
    try {
      logger.info('📥 Received request', { body: req.body });

      const body = (req.body as unknown as { message: string, to: string });
      if (!body.to || !body.message) {
        logger.warn('Missing required fields');
        return reply.status(HTTP_STATUS.ERROR.BAD_USER_INPUT).send({
          status: "fail",
          message: "Missing 'to' or 'messsage' fields",
          err: "Missing required fields!"
        });
      }

      const { to, message } = body;
      await publishMessage(to, message);
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
