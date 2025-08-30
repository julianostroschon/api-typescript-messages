import { isTesting } from '@/constants';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega as variáveis de ambiente de teste
config({ path: resolve(__dirname, '../.env.test'), quiet: true, });

// Configuração global para timeouts
jest.setTimeout(30000);

// Silencia logs durante os testes
if (isTesting) {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'debug').mockImplementation(() => { });
  jest.spyOn(console, 'info').mockImplementation(() => { });
  jest.spyOn(console, 'warn').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
}