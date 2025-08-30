import { cfg, parentLogger } from "@/infra";
import fastify, { FastifyInstance } from "fastify";
import { constructRoutes } from "./routes";

export async function buildFastify(isAlone: boolean): Promise<FastifyInstance> {
  const app = fastify();

  const logger = parentLogger.child({ service: 'routes' });
  app.get('/.ping', async (): Promise<{ hello: string }> => {
    logger.info('Ping received');
    return { hello: 'world' };
  });

  await constructRoutes(app, logger, isAlone);

  return app;
}

// entrypoint separado
export async function startServer(isAlone: boolean): Promise<FastifyInstance> {
  const logger = parentLogger.child({ service: 'http' });
  const app = await buildFastify(isAlone);

  app.listen({ port: cfg.PORT }, (err: Error | null): void => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    logger.info(`🌐 Server listening on port:${cfg.PORT}`);
  });

  return app
}
