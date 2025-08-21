import { parentLogger } from "@/infra";

const logger = parentLogger.child({ module: 'shutdown' })

export function setupGracefulShutdown(closeFns: Array<() => Promise<void> | void>): void {
  const shutdown = async (signal: string): Promise<void> => {
    logger.warn(`🚧 Received ${signal}, shutting down gracefully...`);
    for (const fn of closeFns) {
      try {
        await fn();
      } catch (err) {
        if (err instanceof Error) {
          logger.error('Error during shutdown:', err.message);
        }
      }
      process.exit(0);
    }
  }
  Object.entries({
    SIGINT: 'SIGINT',
    SIGTERM: 'SIGTERM'
  })
    .map(([event, signal]) => {
      return process.on(event, (): Promise<void> => shutdown(signal))
    })
}
