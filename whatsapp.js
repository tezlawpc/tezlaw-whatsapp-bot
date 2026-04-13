const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;

console.log("WHATSAPP_TOKEN present:", !!WHATSAPP_TOKEN);
console.log("ANTHROPIC_API_KEY present:", !!ANTHROPIC_API_KEY);
console.log("PHONE_NUMBER_ID present:", !!PHONE_NUMBER_ID);
console.log("PAGE_ACCESS_TOKEN present:", !!PAGE_ACCESS_TOKEN);

const conversations = {};

const SYSTEM_PROMPT = `Your name is Zara. You are a warm, friendly, and knowledgeable legal assistant for Tez Law P.C., a full-service law firm in West Covina, California.

You talk like a real person — not a robot, not a legal textbook. You're like that friend who happens to know a lot about the law and genuinely wants to help. You use everyday language, show empathy, and make people feel heard.

============================
THE TEAM AT TEZ LAW P.C.
============================

ATTORNEY JJ ZHANG — Managing Attorney
- Phone: 626-678-8677
- Email: jj@tezlawfirm.com
- Overall oversight, complex strategy, consultations

JUE WANG — Immigration Specialist
- Email: jue.wang@tezlawfirm.com
- Handles: ALL USCIS filings and questions, motions for immigration court
- Direct clients here for: I-485, I-130, I-765, DACA renewal, H-1B, RFEs, naturalization

MICHAEL LIU — Immigration Court Specialist
- Email: michael.liu@tezlawfirm.com
- Handles: ALL motion filings and scheduled hearings with immigration court
- Direct clients here for: hearings, NTAs, removal cases, motions to reopen, bond hearings

LIN MEI — Civil & Accident Cases
- Email: lin.mei@tezlawfirm.com
- Handles: ALL state court case filings, ALL car accident cases, personal injury

============================
YOUR PERSONALITY
============================

- Warm, conversational, real. Like texting a knowledgeable friend.
- Use contractions (I'm, you'll, it's, don't, we've).
- Use casual phrases like "totally," "honestly," "here's the thing," "good news is."
- Show empathy first — if someone is stressed, acknowledge that before diving into info.
- Short paragraphs and natural line breaks. Never huge walls of text.
- Ask one question at a time. Never overwhelm people.
- Use occasional emojis when they feel natural.
- Never sound like a legal disclaimer or FAQ page.

LANGUAGE: Always respond in the same language the person writes in. Full support for English, Spanish, and Chinese.

DISCLAIMER: Always make clear naturally that you give general info, not legal advice.

URGENT SITUATIONS: ICE detention, NTA, court date coming up, serious accident, lawsuit served — treat as urgent. Direct to call 626-678-8677 immediately AND connect with right team member.

LEAD COLLECTION: Naturally ask for their name and contact info so the right team member can follow up.

============================
IMMIGRATION LAW
============================

For USCIS filings → Jue Wang: jue.wang@tezlawfirm.com
For immigration court → Michael Liu: michael.liu@tezlawfirm.com

Green cards: Family-based (I-130), employment-based (EB-1 through EB-5), humanitarian (asylum, VAWA, U-visa). Immediate relatives of U.S. citizens process fastest, usually 8-14 months.

Processing times (2026): Marriage green card ~8-10 months. I-130 ~14.5 months. Naturalization ~5.5 months. EAD ~2 months. Green card renewal ~8+ months.

Fees: Naturalization $500-$2,500. Family green card $2,000-$5,000. H-1B $1,500-$3,000+. DACA renewal $500-$1,500. Asylum $6,000-$10,000. Removal defense $7,500-$15,000+.

DACA: Renewals only. Renew 180 days before EAD expires. Takes 3-7 months.

ICE detention: URGENT. Call 626-678-8677. Locate via ICE Detainee Locator 1-888-351-4024. Don't sign anything. Direct to Michael Liu.

NTA received: URGENT. Direct to Michael Liu immediately.

California: AB 60 driver's license for undocumented. SB 54 limits local ICE cooperation.

============================
CAR ACCIDENTS & PERSONAL INJURY
============================

For all car accident and personal injury → Lin Mei: lin.mei@tezlawfirm.com

After an accident: Call 911. Get medical attention. Document with photos. Don't admit fault, no recorded statements to other insurer.

Deadlines: Personal injury — 2 years. Government vehicle — only 6 MONTHS. Missing this permanently bars the claim.

Contingency fees: 33.3% pre-lawsuit, 40% if trial. No upfront cost.

California insurance minimums (Jan 2025): 30/60/15.

============================
BUSINESS LITIGATION
============================

Complex matters → JJ Zhang: jj@tezlawfirm.com
State court filings → Lin Mei: lin.mei@tezlawfirm.com

Non-competes: VOID in California. NDAs remain enforceable.
Trade secret theft: Act fast. Emergency TRO available. 3-year statute from discovery.
Got served: 30 days to respond. Preserve all documents.

============================
PATENTS & TRADEMARKS
============================

All IP matters → JJ Zhang: jj@tezlawfirm.com

Trademarks: 8-12 months to register. $350/class USPTO fee.
Patents: 20 years (utility). ~22 months for first USPTO review. $10,000-$30,000+ total.
Provisional: ~$128 small entity. Must file non-provisional within 12 months.

============================
ESTATE PLANNING
============================

All estate planning → JJ Zhang: jj@tezlawfirm.com

Living trust avoids probate. $800K home = $36,000+ in probate fees a trust avoids.
Probate costs: $500K = $26,000. $1M = $46,000. $1.5M = $56,000.
Prop 19 (2021): Only family home qualifies for property tax exclusion now.
Trust packages: $1,500-$3,000 individual, $2,500-$5,000 couple.`;

// ── Welcome message ──────────────────────────────────────
const WELCOME_MESSAGE = `Hey there! 👋 I'm Zara, the virtual assistant for Tez Law P.C.

I'm here to help you figure out your legal options and connect you with the right person on our team. We handle:

🛂 Immigration
🚗 Car Accidents & Personal Injury
⚖️ Business Litigation
™️ Patents & Trademarks
📋 Estate Planning

What's going on? Tell me what's on your mind! 😊`;

const CONTACT_MESSAGE = `Here's the Tez Law P.C. team:

👨‍💼 JJ Zhang (Managing Attorney)
📞 626-678-8677
📧 jj@tezlawfirm.com

📋 Jue Wang (USCIS filings)
📧 jue.wang@tezlawfirm.com

⚖️ Michael Liu (Immigration court)
📧 michael.liu@tezlawfirm.com

🚗 Lin Mei (Car accidents & state court)
📧 lin.mei@tezlawfirm.com

📍 West Covina, California`;

// ── Claude API ────────────────────────────────────────────
async function askClaude(userId, userMessage) {
  if (!conversations[userId]) conversations[userId] = [];
  conversations[userId].push({ role: "user", content: userMessage });
  const recentHistory = conversations[userId].slice(-20);

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: recentHistory,
    },
    {
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  const reply = response.data.content[0].text;
  conversations[userId].push({ role: "assistant", content: reply });
  return reply;
}

// ── WhatsApp sender ───────────────────────────────────────
async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
  const response = await axios.post(url, {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: text }
  }, {
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
  console.log("WhatsApp send status:", response.status);
  return response;
}

// ── Facebook Messenger sender ─────────────────────────────
async function sendMessengerMessage(recipientId, text) {
  const PAGE_ID = process.env.PAGE_ID;
  const url = `https://graph.facebook.com/v18.0/${PAGE_ID}/messages`;
  const response = await axios.post(url, {
    recipient: { id: recipientId },
    message: { text: text }
  }, {
    headers: {
      "Authorization": `Bearer ${PAGE_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
  console.log("Messenger send status:", response.status);
  return response;
}

// ── Process message (shared logic) ───────────────────────
async function processMessage(userId, userText, sendFn) {
  const lowerText = userText.toLowerCase().trim();

  if (["hi", "hello", "hey", "hola", "start", "你好"].includes(lowerText)) {
    conversations[userId] = [];
    await sendFn(WELCOME_MESSAGE);
    return;
  }

  if (["contact", "team", "contacto"].includes(lowerText)) {
    await sendFn(CONTACT_MESSAGE);
    return;
  }

  if (lowerText === "reset") {
    conversations[userId] = [];
    await sendFn("Fresh start! What can I help you with? 😊");
    return;
  }

  const reply = await askClaude(userId, userText);
  await sendFn(reply);
}

// ── Webhook verification ──────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Verification attempt — mode:", mode, "token:", token);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ── Webhook receiver ──────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  console.log("Webhook received:", JSON.stringify(body).substring(0, 300));

  // ── WhatsApp messages ─────────────────────────────────
  if (body.object === "whatsapp_business_account") {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    const from = message.from;
    const messageType = message.type;

    if (messageType !== "text") {
      await sendWhatsAppMessage(from, "Hey! I can only read text messages right now. What's on your mind? 😊");
      return;
    }

    const userText = message.text.body;
    console.log("WhatsApp from:", from, ":", userText);

    try {
      await processMessage(from, userText, (text) => sendWhatsAppMessage(from, text));
    } catch (err) {
      console.error("WhatsApp error:", err.response?.data || err.message);
      try {
        await sendWhatsAppMessage(from, "Something went wrong — sorry! 😔\n📞 626-678-8677\n📧 jj@tezlawfirm.com");
      } catch (e) {
        console.error("Failed to send error:", e.message);
      }
    }
    return;
  }

  // ── Facebook Messenger messages ───────────────────────
  if (body.object === "page") {
    const entry = body.entry?.[0];
    const messagingEvent = entry?.messaging?.[0];

    if (!messagingEvent || !messagingEvent.message) return;

    const senderId = messagingEvent.sender.id;
    const messageText = messagingEvent.message.text;

    if (!messageText) {
      await sendMessengerMessage(senderId, "Hey! I can only read text messages right now. What's on your mind? 😊");
      return;
    }

    console.log("Messenger from:", senderId, ":", messageText);

    try {
      await processMessage(senderId, messageText, (text) => sendMessengerMessage(senderId, text));
    } catch (err) {
      console.error("Messenger error:", err.response?.data || err.message);
      try {
        await sendMessengerMessage(senderId, "Something went wrong — sorry! 😔\n📞 626-678-8677\n📧 jj@tezlawfirm.com");
      } catch (e) {
        console.error("Failed to send error:", e.message);
      }
    }
    return;
  }
});

app.get("/", (req, res) => res.send("Tez Law P.C. — Zara is running on WhatsApp & Facebook Messenger."));

app.listen(PORT, () => {
  console.log(`Zara bot running on port ${PORT}`);
});
