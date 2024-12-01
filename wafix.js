import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const client = new Client();

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    if (msg.body.toLowerCase() === 'hallo') {
        msg.reply('Hallo my name is Zootopia');
    } else if (msg.body.toLowerCase() === '!ping') {
        msg.reply('pong');
    } else if (msg.body.startsWith('!echo ')) {
        msg.reply(msg.body.slice(6));
    } else if (msg.body === '!mediainfo' && msg.hasMedia) {
        msg.reply("I am sorry. I am just answering a text-based chat.");
        const attachmentData = await msg.downloadMedia();
        msg.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
    } else {
        // Handle other messages using Google Generative AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const chat = model.startChat({
            history: [
                {
                    "role": "user",
                    "parts": [
                      "Analyze the sentiment of the following Tweets and classify them as POSITIVE, NEGATIVE, or NEUTRAL. \"It's so beautiful today!\"",
                    ],
                  },
                  {
                    "role": "model",
                    "parts": [
                      "POSITIVE",
                    ],
                  },
                  {
                    "role": "user",
                    "parts": [
                      "\"It's so cold today I can't feel my feet...\"",
                    ],
                  },
                  {
                    "role": "model",
                    "parts": [
                      "NEGATIVE",
                    ],
                  },
                  {
                    "role": "user",
                    "parts": [
                      "\"The weather today is perfectly adequate.\"",
                    ],
                  },
                  {
                    "role": "model",
                    "parts": [
                      "NEUTRAL",
                    ],
                  },
            ],
            generationConfig: {
                maxOutputTokens: 200,
            },
        });

        try {
            const result = await chat.sendMessage(msg.body);
            const response = await result.response;
            const text = await response.text();
            msg.reply(text);
        } catch (error) {
            console.error('Error handling AI response:', error);
            msg.reply('Sorry, I am having trouble understanding your message right now.');
        }
    }
});

client.initialize();
