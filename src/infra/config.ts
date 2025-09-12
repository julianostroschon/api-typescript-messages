import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Serviços de Mensagens
  TELEGRAM_TOKEN: z.string().default('token'),

  // Autenticação
  JWT_SECRET: z.string().min(5, 'secret'),
  // CHAT_API_SECRET: z.string(),

  // RabbitMQ
  RABBITMQ_URL: z.url().optional(),
  MAIN_QUEUE: z.string().default('messages'),
  SKIPPED_CHARS: z.string().default('_'),
  ROUTINE_NEW_MESAGE: z.string().default('new-message'),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Erro ao validar variáveis de ambiente:');
  console.error(parsed.error.format());
  process.exit(1);
}

const rawEnv = parsed.data;

const processTitle = process.argv[1] || 'unknown';
function getProcessType(): 'producer' | 'consumer' | 'unknown' {
  if (processTitle.includes('producer')) return 'producer';
  if (processTitle.includes('consumer')) return 'consumer';
  return 'unknown';
}

export const cfg = {
  ...rawEnv,
  serviceType: getProcessType(),
};
