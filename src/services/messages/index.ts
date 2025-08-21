import { sendTelegramMessage } from "../telegram";

export enum MessageServices {
  Telegram = 'TELEGRAM'
}

const transportMessages = {
  [MessageServices.Telegram]: sendTelegramMessage
}

export async function sendMessage(service: MessageServices, body: { to: string, message: string }): Promise<{ status: string }> {
  return transportMessages[service](body.to, body.message)
}