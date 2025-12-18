import fetch from "node-fetch";
import * as cheerio from "cheerio";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

if (!WEBHOOK_URL) {
  console.error("DISCORD_WEBHOOK missing");
  process.exit(1);
}

async function fetchSteamFreeGames() {
  const res = await fetch("https://steamdb.info/sales/?min_discount=100");
  const html = await res.text();
  const $ = cheerio.load(html);

  const games = [];

  $("tr.app").each((_, row) => {
    const appId = $(row).attr("data-appid");
    const name = $(row).find(".b").text().trim();

    if (appId && name) {
      games.push({
        name,
        link: `https://store.steampowered.com/app/${appId}/`,
      });
    }
  });

  return games;
}

async function sendToDiscord(games) {
  if (!games.length) return;

  const message = games
    .map(g => `🎉 **FREE on Steam**\n🕹 ${g.name}\n🔗 ${g.link}`)
    .join("\n\n");

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
}

const games = await fetchSteamFreeGames();
await sendToDiscord(games);

console.log(`Checked ${games.length} games`);
