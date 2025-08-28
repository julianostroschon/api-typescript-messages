import { cfg, parentLogger } from "@/infra";
import fastify, { FastifyInstance } from "fastify";
import { constructRoutes } from "./routes";

export async function buildFastify(): Promise<FastifyInstance> {
  const app = fastify();
  const logger = parentLogger.child({ service: 'http' });

  app.get('/.ping', async (): Promise<{ hello: string }> => {
    return { hello: 'world' };
  });

  await constructRoutes(app, logger);

  return app;
}

// entrypoint separado
export async function startServer(): Promise<FastifyInstance> {
  const app = await buildFastify();

  app.listen({ port: cfg.PORT }, (err: Error | null): void => {
    if (err) {
      parentLogger.child({ service: 'http' }).error(err);
      process.exit(1);
    }
    parentLogger.child({ service: 'http' }).info(`🌐 Server listening on port:${cfg.PORT}`);
  });

  return app
}
