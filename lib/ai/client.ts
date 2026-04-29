import "server-only";

import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: process.env.TOKEN_ROUTER_API_KEY,
  baseURL: process.env.TOKEN_ROUTER_BASE_URL,
});
