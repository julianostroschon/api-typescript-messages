const TelegramBot = require('node-telegram-bot-api')

// replace the value below with the Telegram token you receive from @BotFather
const token = "7676761223:AAGW4WKUWFQCHo6CXw0nkWZmLaKZZ_i-87w"

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

// Matches "/echo [whatever]"
bot.onText(/\/start(.+)/, (msg) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id
  bot?.sendMessage(chatId, chatId, {
    reply_to_message_id: msg.message_id
  })
  // send back the matched "whatever" to the chat
})

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id
  bot?.sendMessage(chatId, chatId, {
    reply_to_message_id: msg.message_id
  })
  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, 'Received your message')
})