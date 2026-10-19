import { env } from './config.mjs';
import { categories, regions } from '../site.config.mjs';
import { fetchWithTimeout, log, sleep } from './util.mjs';

const CATS = categories.map((c) => c.slug).join(', ');
const REGIONS = regions.join(', ');

const SHAPE = `Return ONLY a JSON object with exactly these keys:
{
  "headline": "max 90 characters, sentence case, new wording — do not reuse any source headline",
  "standfirst": "1-2 sentences (max 45 words) summarising the story",
  "category": "one of: ${CATS}",
  "region": "one of: ${REGIONS}",
  "tags": ["3 to 6 short topic tags, e.g. people, places, organisations, themes"],
  "keyPoints": ["3 to 5 short factual bullet points"],
  "sections": [
    { "heading": "", "paragraphs": ["opening paragraphs: who, what, where, when"] },
    { "heading": "short subheading", "paragraphs": ["2-3 paragraphs"] }
  ],
  "highlight": "one striking sentence taken from YOUR article text (not a quote from a person)",
  "timeline": [{ "when": "date or period", "what": "event" }],
  "socialSummary": "one plain sentence, max 140 characters, for a social media card",
  "imageQuery": "2-5 words naming the most concrete visual subject — a specific person, place, landmark or object (e.g. 'Nile river Egypt', 'Eiffel Tower', 'electric car battery')",
  "imageAlt": "alt text for a photo of the imageQuery subject, max 120 characters, plain description without 'image of' (e.g. 'The Nile river flowing past the Cairo skyline')",
  "importance": 1-10,
  "breaking": true or false
}`;

const SYSTEM = `You are a senior editor at Globriefly, an international English-language news site.
You write clear, neutral, engaging news articles for a global audience.

STRICT RULES
1. Use ONLY facts found in the source material. Never invent facts, names, numbers, dates, places or quotes.
2. Write entirely in your own words. Do not copy sentences or distinctive phrases from the sources. Use your own structure and order.
3. Direct quotes: at most one, under 15 words, copied exactly from the sources and attributed to the named speaker. Otherwise paraphrase what people said.
4. Do not mention or name the source outlets in the article text, and never mention AI, automation or how the article was produced.
5. Explain background and why the story matters, using only context present in the sources or widely known general facts (e.g. what an organisation is).
6. "timeline": include only if the sources give at least 3 dated events; otherwise return an empty array.
7. Length: 600-900 words across 4-6 sections. Short paragraphs (2-4 sentences). British-neutral spelling is fine.
8. Tone: factual, calm, no sensationalism, no opinions.

${SHAPE}`;

const EXPLAINER_SYSTEM = `You are a senior editor at Globriefly writing an "Explained" piece: a simple, friendly guide to the background of today's biggest story.
Headline must be a question (e.g. "What is ...?", "Why are ...?", "How does ...?").
Use the source material plus widely known general knowledge. Never invent specific recent facts, numbers or quotes.
Write in your own words, 500-750 words, 4-5 sections with question-style subheadings, short paragraphs.
Never mention AI or how the article was produced. "timeline" may be empty. "breaking" must be false.

${SHAPE}`;

function buildUser(cluster, texts) {
  const parts = cluster.items.slice(0, 4).map((it, i) => {
    const body = texts[i] ? texts[i] : it.summary;
    return `SOURCE ${i + 1}\nHeadline: ${it.title}\nPublished: ${new Date(it.date).toISOString()}\nText: ${body}`;
  });
  return `Suggested category: ${cluster.hint}\nToday: ${new Date().toISOString().slice(0, 10)}\n\n${parts.join('\n\n---\n\n')}`;
}

async function callGemini(system, user) {
  for (const model of env.GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        }),
      }, 90000);
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
        if (text) return text;
      }
      const errText = res.ok ? 'empty response' : await res.text();
      log(`gemini ${model} failed (${res.status}): ${errText.slice(0, 200)}`);
      if (res.status === 429) await sleep(20000);
      else if (res.status === 503 || res.status === 500) await sleep(6000); // model briefly busy: wait and retry once
      else break;
    }
  }
  return null;
}

async function callGroq(system, user) {
  if (!env.GROQ_API_KEY || !env.GROQ_MODEL) return null;
  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  }, 90000);
  if (!res.ok) { log(`groq failed (${res.status}): ${(await res.text()).slice(0, 200)}`); return null; }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

function parseJSON(text) {
  if (!text) return null;
  try {
    return JSON.parse(text.replace(/^```json\s*|```$/g, '').trim());
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : null; } catch { return null; }
  }
}

function valid(a) {
  return a && typeof a.headline === 'string' && a.headline.length > 10 && Array.isArray(a.sections) && a.sections.length >= 2 && categories.some((c) => c.slug === a.category);
}

async function generate(system, user) {
  let out = parseJSON(env.GEMINI_API_KEY ? await callGemini(system, user) : null);
  if (!valid(out)) out = parseJSON(await callGroq(system, user));
  return valid(out) ? out : null;
}

export async function writeArticle(cluster, texts, extraInstruction = '') {
  return generate(SYSTEM, buildUser(cluster, texts) + (extraInstruction ? `\n\nEDITOR NOTE: ${extraInstruction}` : ''));
}

export async function writeExplainer(cluster, texts) {
  return generate(EXPLAINER_SYSTEM, buildUser(cluster, texts));
}
