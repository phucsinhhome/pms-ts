/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 *
 * See the getting started guide for more information
 * https://ai.google.dev/gemini-api/docs/get-started/node
 */

const {
  GoogleGenerativeAI,
  // HarmCategory,
  // HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

var chatSession: any = null

async function run(expenseMessage: string) {

  if (chatSession == null) {
    chatSession = model.startChat({
      generationConfig,
      // safetySettings: Adjust safety settings
      // See https://ai.google.dev/gemini-api/docs/safety-settings
      history: [
        {
          role: "user",
          parts: [
            {text: "As a accountant, I need you to analyze the chat message and extract daily expense with following data fields: \n- item name is the name of product\n- unit could be kilogram, gram, count, hour\n- quantity is an integer number\n- price in VND.\n- service is one of STAY, FOOD or TOUR, this value depends on item name\nThese are some examples\n\"5kg sugar 560k\" means \"item: Sugar, quantity: 5, unit: kg, price: 560000, service: FOOD\"\n\"560 sugar for 5kg\" means \"item: Sugar, quantity: 5, unit: kg, price: 560000, service FOOD\"\n\"sugar 5kg 560\" means \"item: Sugar, quantity: 5, unit: kg, price: 560000, service FOOD\"\n\"sugar 5g 560\" means \"item: Sugar, quantity: 5, unit: g, price: 560000, service FOOD\"\n\"5 buckets 230\" means \"item: Bucket, quantity: 5,  unit: count, price: 230000, service FOOD\"\n\"Can oil 5L 160\" means \"item: Oil 5L, quantity: 1,  unit: count, price: 160000, service FOOD\"\n\"15k bột ngọt\" means \"item: Bột ngọt, quantity: 1,  unit: count, price: 15000, service FOOD\"\n\"15kg đường cát\" means \"item: Đường cát, quantity: 15,  unit: kg, price: 0, service FOOD\"\n\"1 bungalow room 450k\" means \"item: Bungalow room, quantity: 1,  unit: count, price: 450000, service: STAY\"\n\"2 hours bike rental 60k\" means \"item: Bike rental, quantity: 2,  unit: hour, price: 60000, service: STAY\"\n\"mekong tour 800k\" means \"item: Mekong tour, quantity: 1,  unit: count, price: 800000, service: TOUR\"\nPlease try to extract expense in message and format the item name with sentence case"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\":[{\"item\": \"Sugar\", \"unit\": \"kg\", \"quantity\": 5, \"price\": 560000, \"service\": \"FOOD\"}, {\"item\": \"Sugar\", \"unit\": \"kg\", \"quantity\": 5, \"price\": 560000, \"service\": \"FOOD\"}, {\"item\": \"Sugar\", \"unit\": \"kg\", \"quantity\": 5, \"price\": 560000, \"service\": \"FOOD\"}, {\"item\": \"Sugar\", \"unit\": \"g\", \"quantity\": 5, \"price\": 560000, \"service\": \"FOOD\"}, {\"item\": \"Bucket\", \"unit\": \"count\", \"quantity\": 5, \"price\": 230000, \"service\": \"FOOD\"}, {\"item\": \"Oil 5L\", \"unit\": \"count\", \"quantity\": 1, \"price\": 160000, \"service\": \"FOOD\"}, {\"item\": \"Bột ngọt\", \"unit\": \"count\", \"quantity\": 1, \"price\": 15000, \"service\": \"FOOD\"}, {\"item\": \"Đường cát\", \"unit\": \"kg\", \"quantity\": 15, \"price\": 0, \"service\": \"FOOD\"}, {\"item\": \"Bungalow room\", \"unit\": \"count\", \"quantity\": 1, \"price\": 450000, \"service\": \"STAY\"}, {\"item\": \"Bike rental\", \"unit\": \"hour\", \"quantity\": 2, \"price\": 60000, \"service\": \"STAY\"}, {\"item\": \"Mekong tour\", \"unit\": \"count\", \"quantity\": 1, \"price\": 800000, \"service\": \"TOUR\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "I bought 3g sugar with 460k today"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Sugar\", \"unit\": \"g\", \"quantity\": 3, \"price\": 460000, \"service\": \"FOOD\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "I buy 5 buckets with 460k"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Bucket\", \"unit\": \"count\", \"quantity\": 5, \"price\": 460000, \"service\": \"FOOD\"}]}\n\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "Bottle of Mezan 5L 700k"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"unit\": \"count\", \"quantity\": 1, \"price\": 700000, \"service\": \"FOOD\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "2 bottles of Mezan 5L cost 1200k"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"unit\": \"count\", \"quantity\": 2, \"price\": 1200000, \"service\": \"FOOD\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "2 Mezan 5L 1200k"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"unit\": \"count\", \"quantity\": 2, \"price\": 1200000, \"service\": \"FOOD\"}]}\n\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "2 Mezan 5L 1,2 million"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Mezan 5L\", \"unit\": \"count\", \"quantity\": 2, \"price\": 1200000, \"service\": \"FOOD\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "15kg đường cát trắng"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Đường cát trắng\", \"unit\": \"kg\", \"quantity\": 15, \"price\": 0, \"service\": \"FOOD\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "mekong tour 800k"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Mekong tour\", \"unit\": \"count\", \"quantity\": 1, \"price\": 800000, \"service\": \"TOUR\"}]}\n"},
          ],
        },
        {
          role: "user",
          parts: [
            {text: "family room 900k"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "{\"expenses\": [{\"item\": \"Family room\", \"unit\": \"count\", \"quantity\": 1, \"price\": 900000, \"service\": \"STAY\"}]}\n"},
          ],
        },
      ],
    });
  }

  const result = await chatSession.sendMessage(expenseMessage);
  console.log("EXTRACTION DONE");

  return result.response.text();
}

export default run