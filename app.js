require("dotenv").config();
const { Telegraf } = require("telegraf");
const { Pool } = require("pg");

// Ініціалізація бота і підключення до бази даних
const bot = new Telegraf(process.env.BOT_TOKEN);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ID каналу, куди буде надіслано голосування
// const CHANNEL_ID = '@your_channel_name'; // Замініть на ID вашого каналу
const CHANNEL_ID = "@official_noris"; // Замініть на ID вашого каналу

// Обробка кнопки для голосування
bot.action("vote", async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username;

  try {
    // Перевірка, чи голосував користувач раніше
    const result = await pool.query("SELECT * FROM votes WHERE user_id = $1", [
      userId,
    ]);
    if (result.rows.length > 0) {
      // Якщо запис існує, повідомляємо користувача, що він уже проголосував
      await ctx.answerCbQuery("Ви вже проголосували!");

      // Зміна тексту кнопки на "Ви вже проголосували!" і додавання кнопки для перегляду кількості голосів
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
          [{ text: "Прийняти участь😍", callback_data: "vote" }],
          [
            {
              text: "Дізнатись к-сть учасників",
              callback_data: "vote_counter",
            },
          ],
        ],
      });
    } else {
      // Якщо запису немає, зберігаємо голос у базі даних
      await pool.query(
        "INSERT INTO votes (user_id, username) VALUES ($1, $2)",
        [userId, username]
      );

      await ctx.answerCbQuery("Дякуємо за ваш голос!");

      // Зміна тексту кнопки на "Ви вже проголосували!" і додавання кнопки для перегляду кількості голосів
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [
            [{ text: "Прийняти участь😍", callback_data: "vote" }],
            [
              {
                text: "Дізнатись к-сть учасників",
                callback_data: "vote_counter",
              },
            ],
          ],
      });
    }
  } catch (err) {
    console.error("Помилка при записі голосу:", err);
  }
});

// Обробка кнопки для підрахунку кількості голосів
bot.action("vote_counter", async (ctx) => {
  try {
    // Підрахунок кількості голосів
    const result = await pool.query("SELECT COUNT(*) FROM votes");
    const count = result.rows[0].count;

    // Відповідь із кількістю голосів
    await ctx.answerCbQuery(`Зараз проголосувало ${count} учасників.`);
  } catch (err) {
    console.error("Помилка при підрахунку голосів:", err);
    await ctx.answerCbQuery("Виникла помилка при підрахунку голосів.");
  }
});
// Надсилання голосування в канал
bot.command("send_vote", async (ctx) => {
  try {
    await bot.telegram.sendMessage(
      CHANNEL_ID,
      `🎉 **Розіграш 200$ для нових підписників TikTok!** 🎉
      
      🔥 Хочеш виграти 200$? У мене є супер-акція для тебе! 🔥
      
      Просто виконуй кілька простих кроків і отримуй шанс на крутий виграш! 💸
      
      **Щоб взяти участь, потрібно:**
      
      1️⃣ **Підпишись на мій TikTok** [@noris_real](https://www.tiktok.com/@noris_real)   
      2️⃣ **Підпишись на мій Telegram канал** [@official_noris](https://t.me/@official_noris) 
      3️⃣ **Проголосуй у цьому опитуванні!** 📊  
      4️⃣ **Поділись цим постом з другом** 🤝  
      5️⃣ **Постав лайк на мої відео в ТікТок** ❤️ 
      6️⃣**Коментуй відео та взаємодій з коментарями інших учасників для більшої активності** ❤️ 
      
      ✨ **Умови розіграшу:**
      
      - 💰 Приз: 200$ для одного щасливчика!  
      - 🗓️ Розіграш відбудеться, коли на моєму ТікТок аккаунті буде 10,000 підписників.  
      - 📍 Переможець буде обраний випадковим чином серед тих, хто виконає всі умови!  
      - 💌 Результати розіграшу оголошу на своєму TikTok та в Telegram!  
      
      🎯 **Важливо виконати усі умови** 🎯
      
      Не гайте часу — у вас є лише обмежений час, щоб приєднатися до розіграшу! ⏳
      
      💥 Удачі! 💥
      `,
      {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "Прийняти участь😍", callback_data: "vote" }],
                [
                  {
                    text: "Дізнатись к-сть учасників",
                    callback_data: "vote_counter",
                  },
                ],
              ],
        },
        disable_web_page_preview: true,
      }
    );

    await ctx.reply("Голосування успішно надіслано в канал.");
  } catch (err) {
    console.error("Помилка при надсиланні в канал:", err);
    await ctx.reply("Виникла помилка при надсиланні голосування в канал.");
  }
});

// Запуск бота
bot.launch();
