import { config } from 'dotenv';

// Carrega as variáveis de ambiente de teste
config({ path: '../.env.test' });

// Configuração global para timeouts
jest.setTimeout(30000);

// Silencia logs durante os testes
jest.spyOn(console, 'log').mockImplementation(() => { });
jest.spyOn(console, 'info').mockImplementation(() => { });
jest.spyOn(console, 'warn').mockImplementation(() => { });
jest.spyOn(console, 'error').mockImplementation(() => { });