import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
});

const imageUrlToBase64 = async (imageUrl) => {
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  });

  return Buffer.from(response.data).toString('base64');
};

export const analyzePhotoWithAI = async (imageUrl) => {
  const imageBase64 = await imageUrlToBase64(imageUrl);

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    },
    `
You are a professional cinematographer.

Analyze this image.

Respond ONLY in JSON:

{
  "isPhoto": true,
  "imageType": "photograph",
  "subject": "main subject here",
  "compositionCommentary": "brief composition analysis",
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ]
}
`
  ]);

  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('AI validation failed');
  }

  return JSON.parse(jsonMatch[0]);
};

/**
 * Get rich AI composition feedback from Claude Vision
 */
export const getAIFeedback = async (imageUrl, moduleResults) => {
  const modulesSummary = moduleResults
    .map(m => `${m.name}: ${m.score}/100 — ${m.feedback}`)
    .join('\n');

const imageBase64 = await imageUrlToBase64(imageUrl);

const result = await model.generateContent([
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64
    }
  },
  `You are a professional cinematographer and photography expert.

Analyze this image's composition.

Here are the algorithmic scores from our analysis engine:
${modulesSummary}

Please provide:
1. A 2-3 sentence overall assessment of the composition.
2. The cinematic genre or mood this shot evokes.
3. Three specific actionable suggestions.

Respond ONLY in valid JSON:
{
  "overall_assessment": "...",
  "genre": "...",
  "mood": "...",
  "suggestions": ["...", "...", "..."]
}`
]);

const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Get AI recomposition suggestion (suggested crop)
 */
export const getRecompositionSuggestion = async (imageUrl, imageWidth, imageHeight) => {
  const imageBase64 = await imageUrlToBase64(imageUrl);

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    },
    `This image is ${imageWidth}x${imageHeight} pixels.

Analyze the composition and suggest the optimal crop.

Respond ONLY in valid JSON:

{
  "x": 0.1,
  "y": 0.1,
  "width": 0.8,
  "height": 0.8,
  "reason": "..."
}`
  ]);

  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('AI did not return valid recomposition JSON');
  }

  return JSON.parse(jsonMatch[0]);
};
/**
 * Compare two shots and provide cinematographic comparison
 */

export const compareShots = async (imageUrlA, imageUrlB) => {
  const imageABase64 = await imageUrlToBase64(imageUrlA);
  const imageBBase64 = await imageUrlToBase64(imageUrlB);

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageABase64
      }
    },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBBase64
      }
    },
    `Compare these two shots as a cinematography expert. The first image is Shot A, the second image is Shot B.

Respond ONLY in valid JSON:

{
  "winner": "A",
  "composition_comparison": "...",
  "lighting_comparison": "...",
  "mood_comparison": "...",
  "recommendation": "..."
}`
  ]);

  const text = result.response.text();

  const start = text.indexOf('{');
const end = text.lastIndexOf('}');

if (start === -1 || end === -1) {
  throw new Error('AI did not return valid comparison JSON');
}

const jsonText = text.substring(start, end + 1);

console.log('COMPARE AI RESPONSE:', text);
console.log('JSON TO PARSE:', jsonText);

return JSON.parse(jsonText);
};