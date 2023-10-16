require("dotenv").config();

const fs = require("fs").promises;
const fsExtra = require("fs-extra");
const { exec } = require("child_process");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Received your message");
});

bot.on("document", async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.document.file_id;

  await bot.downloadFile(fileId, "./src/downloads");

  fsExtra.readdir("./src/downloads", (err, files) => {
    if (err) throw err;
    const firstFile = files[0];
    const filePath = `./src/downloads/${firstFile}`;

    exec(
      `ffmpeg -i ${filePath} -vn -ar 44100 -ac 2 -b:a 192k ./src/converted/converted_file.mp3`,
      (error) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        fs.readFile("./src/converted/converted_file.mp3").then(
          async (fileBuffer) => {
            await bot.sendAudio(chatId, fileBuffer);
            fsExtra.emptyDirSync("./src/converted");
            fsExtra.emptyDirSync("./src/downloads");
          }
        );
      }
    );
  });
});
