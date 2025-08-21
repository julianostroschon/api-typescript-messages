import fastify, { FastifyInstance } from "fastify";

import { cfg, parentLogger } from "@/infra";
import { constructRoutes } from "./routes";

export async function buildFastify(): Promise<FastifyInstance> {
  const app = fastify();
  const logger = parentLogger.child({ service: 'http' });

  app.get('/.ping', async (): Promise<{ hello: string }> => {
    return { hello: 'world' };
  });

  await constructRoutes(app, logger);

  app.listen({ port: cfg.PORT }, (err: Error | null): void => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    logger.info(`🌐 Server listening on port:${cfg.PORT}`);
  });

  return app;
}