require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createReadStream } = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

function isValidM3U8URL(url) {
  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  const extension = url.split('.').pop().toLowerCase();
  return urlRegex.test(url) && extension === 'm3u8';
}

function createBot() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => ctx.reply('Welcome to the M3U8 to MP3 converter bot! Send me an M3U8 file or URL to convert.'));

  bot.on('message', async (ctx) => {
    if (ctx.message.document && ctx.message.document.mime_type === 'application/x-mpegURL') {
      const inputFile = `https://api.telegram.org/file/bot${bot.token}/${ctx.message.document.file_path}`;
      await convertM3U8(inputFile, ctx);
    } else if (ctx.message.text && ctx.message.text.endsWith('.m3u8')) {
      const inputURL = ctx.message.text;
      if (isValidM3U8URL(inputURL)) {
        await convertM3U8(inputURL, ctx);
      } else {
        ctx.reply('Please provide a valid M3U8 URL.');
      }
    } else {
      ctx.reply('Please send a valid M3U8 file or URL.');
    }
  });

  function convertM3U8(input, ctx) {
    const outputFilename = 'output.mp3'; // Default output filename
    const output = path.join(__dirname, outputFilename);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .setFfmpegPath(ffmpegInstaller.path)
        .input(input)
        .output(output)
        .on('end', () => {
          ctx.replyWithAudio({ source: createReadStream(output) });
          resolve();
        })
        .on('error', (err) => {
          console.error(err);
          ctx.reply('An error occurred during the conversion. Please try again later.');
          reject(err);
        })
        .run();
    });
  }

  return bot;
}

module.exports = createBot;
