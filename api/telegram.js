require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createReadStream } = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome to the M3U8 to MP3 converter bot! Send me an M3U8 file or URL to convert.'));
bot.on('message', async (ctx) => {
  if (ctx.message.document && ctx.message.document.mime_type === 'application/x-mpegURL') {
    const file = await bot.telegram.getFile(ctx.message.document.file_id);
    const inputFile = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    convertM3U8(inputFile, ctx);
  } else if (ctx.message.text && ctx.message.text.endsWith('.m3u8')) {
    const inputURL = ctx.message.text;
    convertM3U8(inputURL, ctx);
  } else {
    ctx.reply('Please send a valid M3U8 file or URL.');
  }
});

function convertM3U8(input, ctx) {
  const outputFilename = 'output.mp3'; // Default output filename
  const output = path.join(__dirname, outputFilename);
  
  const command = ffmpeg()
    .setFfmpegPath(ffmpegInstaller.path)
    .input(input)
    .output(output)
    .on('end', () => {
      ctx.replyWithAudio({ source: createReadStream(output) });
    })
    .on('error', (err) => {
      console.error(err);
      ctx.reply('An error occurred during the conversion.');
    })
    .run();
}

module.exports = bot;
