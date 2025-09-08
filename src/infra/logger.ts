import { isProduction } from '@/constants';
import winston from 'winston';

export const parentLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp({ format: "HH:mm-dd/MM/YY" }), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const options = isProduction ? { format: winston.format.simple() } : {
  format: winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.simple()
  )
}
parentLogger.add(new winston.transports.Console(options));
