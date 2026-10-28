import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  evaluateOfflineTriage,
  PatientIntake,
} from './src/utils/triageEngine.ts';
import { SupportedLanguage } from './src/utils/tarabaData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    res.json({
      status: 'ok',
      service: 'PHC-Aid Taraba Clinical Triage Server',
      geminiConfigured: hasGeminiKey,
      offlineEngineReady: true,
    });
  });

  // Hybrid AI + Nigeria Standing Orders Triage Endpoint
  app.post('/api/triage', async (req, res) => {
    try {
      const intake: PatientIntake = req.body.intake;
      const language: SupportedLanguage = req.body.language || 'en';
      const forceOffline: boolean = Boolean(req.body.offlineMode);

      if (!intake || typeof intake !== 'object') {
        res.status(400).json({ error: 'Valid patient intake payload is required.' });
        return;
      }

      // First compute the deterministic Nigeria Standing Orders & WHO IMCI baseline
      const baselineResult = evaluateOfflineTriage(intake, language);

      if (forceOffline) {
        res.json(baselineResult);
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.json(baselineResult);
        return;
      }

      try {
        const systemInstruction = `You are PHC-Aid Taraba, a clinical decision support and triage assistant designed for Community Health Extension Workers (CHEWs) and nurses in Primary Health Centers across Taraba State, Nigeria.
Follow Nigeria National Standing Orders for Primary Health Care and WHO IMCI guidelines.
Always provide culturally respectful, clinically accurate guidance in English, Hausa (Harshen Hausa), and Jukun (Wapan / Takum / Wukari dialect of Taraba State).
Emphasize point-of-care diagnostics (like Malaria mRDT, 20-Minute Whole Blood Clotting Test for carpet viper snakebite, Lassa fever IPC isolation) and weight-adjusted medication dosing.`;

        const prompt = `Patient Intake at Taraba PHC:
- Name: ${intake.patientName || 'Unnamed Patient'}
- Age: ${intake.ageYears} years, Sex: ${intake.sex}, Weight: ${intake.weightKg} kg, Axillary Temp: ${intake.tempC} °C
- MUAC: ${intake.muacCm ?? 'N/A'} cm, Pregnant: ${intake.isPregnant ? 'Yes' : 'No'}
- Selected Symptom IDs: ${intake.selectedSymptoms.join(', ') || 'None'}
- Clinical Notes / Chief Complaint: ${intake.freeTextSymptoms || 'None'}
- Standing Orders Baseline Classification: ${baselineResult.acuity} — ${baselineResult.primaryDiagnosis.conditionName}
- Requested Active UI Language: ${language === 'ha' ? 'Hausa' : language === 'jk' ? 'Jukun (Wapan)' : 'English'}

Provide a concise clinical triage response in the requested language and trilingual patient counseling summaries (en, ha, jk).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                assistantReply: {
                  type: Type.STRING,
                  description:
                    'Direct clinical triage guidance for the PHC health worker in the requested active language (en, ha, or jk).',
                },
                counselingEn: {
                  type: Type.STRING,
                  description: 'Clear patient/caregiver counseling instructions in English.',
                },
                counselingHa: {
                  type: Type.STRING,
                  description: 'Clear patient/caregiver counseling instructions in Hausa.',
                },
                counselingJk: {
                  type: Type.STRING,
                  description:
                    'Clear patient/caregiver counseling instructions in Jukun (Wapan) with natural Taraba phrasing.',
                },
              },
              required: ['assistantReply', 'counselingEn', 'counselingHa', 'counselingJk'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          res.json({
            ...baselineResult,
            assistantReply: parsed.assistantReply || baselineResult.assistantReply,
            counselingTrilingual: {
              en: parsed.counselingEn || baselineResult.counselingTrilingual.en,
              ha: parsed.counselingHa || baselineResult.counselingTrilingual.ha,
              jk: parsed.counselingJk || baselineResult.counselingTrilingual.jk,
            },
            engineSource: 'gemini-hybrid',
          });
          return;
        }
      } catch (_aiErr) {
        // Gracefully fall back to deterministic Standing Orders baseline if network/API fails
      }

      res.json(baselineResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Triage evaluation error';
      res.status(500).json({ error: message });
    }
  });

  // Follow-up Clinical Chat Endpoint (English, Hausa, Jukun)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, language, intake, offlineMode } = req.body as {
        message: string;
        language: SupportedLanguage;
        intake?: PatientIntake;
        offlineMode?: boolean;
      };

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message text is required.' });
        return;
      }

      const effectiveIntake: PatientIntake = intake || {
        patientName: 'Walk-in Patient',
        ageYears: 12,
        sex: 'F',
        weightKg: 32,
        tempC: 38.4,
        facilityId: 'phc-wukari',
        selectedSymptoms: [],
        freeTextSymptoms: message,
      };

      const updatedIntake: PatientIntake = {
        ...effectiveIntake,
        freeTextSymptoms: `${effectiveIntake.freeTextSymptoms || ''} ${message}`.trim(),
      };

      const offlineEval = evaluateOfflineTriage(updatedIntake, language || 'en');

      if (offlineMode) {
        res.json({
          reply: offlineEval.assistantReply,
          assessment: offlineEval,
          source: 'offline-standing-orders',
        });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.json({
          reply: offlineEval.assistantReply,
          assessment: offlineEval,
          source: 'offline-standing-orders',
        });
        return;
      }

      try {
        const langName =
          language === 'ha'
            ? 'Hausa (Harshen Hausa)'
            : language === 'jk'
            ? 'Jukun Wapan (with helpful Hausa/English clinical terms)'
            : 'English';

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Health Worker / Patient Message: "${message}"
Patient Context: ${effectiveIntake.patientName}, ${effectiveIntake.ageYears}yo, ${effectiveIntake.weightKg}kg, Temp ${effectiveIntake.tempC}°C.
Standing Orders Assessment: ${offlineEval.acuity} — ${offlineEval.primaryDiagnosis.conditionName}.
Primary Regimen: ${offlineEval.dosagePlan.map((d) => `${d.medication}: ${d.dosePerAdministration} (${d.schedule})`).join('; ')}.

Respond directly in ${langName} with practical Nigeria PHC Standing Orders guidance, red flags to watch for, and weight-specific dosing.`,
          config: {
            systemInstruction:
              'You are PHC-Aid Taraba, an expert tropical disease triage assistant for Primary Health Centers in Taraba State, Nigeria. Keep answers concise, structured, and actionable for low-resource clinics.',
          },
        });

        const textReply = response.text?.trim() || offlineEval.assistantReply;
        res.json({
          reply: textReply,
          assessment: {
            ...offlineEval,
            assistantReply: textReply,
            engineSource: 'gemini-hybrid',
          },
          source: 'gemini-hybrid',
        });
        return;
      } catch (_err) {
        res.json({
          reply: offlineEval.assistantReply,
          assessment: offlineEval,
          source: 'offline-standing-orders',
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Chat error';
      res.status(500).json({ error: msg });
    }
  });

  // Optional Gemini TTS endpoint for spoken counseling in low-literacy settings
  app.post('/api/tts', async (req, res) => {
    try {
      const { text } = req.body as { text: string };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required for speech synthesis.' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(200).json({ fallbackToBrowserSpeech: true });
        return;
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.slice(0, 500),
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const base64Audio =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
          return;
        }
      } catch (_ttsErr) {
        // Fallback to browser Web Speech API
      }

      res.status(200).json({ fallbackToBrowserSpeech: true });
    } catch (error) {
      res.status(200).json({ fallbackToBrowserSpeech: true });
    }
  });

  // Voice Audio Transcription Endpoint (gemini-3.5-transcribe)
  app.post('/api/voice-transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType, language } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        language?: SupportedLanguage;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'Audio base64 data is required.' });
        return;
      }

      const ai = getGenAIClient();
      if (!ai) {
        res.status(200).json({ fallbackToLocalSpeech: true });
        return;
      }

      try {
        const audioPart = {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBase64,
          },
        };
        const langHint =
          language === 'ha'
            ? 'Hausa'
            : language === 'jk'
            ? 'Jukun (Wapan) or Hausa'
            : 'English';

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              audioPart,
              {
                text: `Transcribe this spoken clinical symptom report accurately (${langHint}). Return only the plain transcribed text.`,
              },
            ],
          },
        });

        const transcript = response.text?.trim() || '';
        if (transcript) {
          res.json({ transcript });
          return;
        }
      } catch (_transcribeErr) {
        // Fallback to local speech recognition
      }

      res.status(200).json({ fallbackToLocalSpeech: true });
    } catch (_err) {
      res.status(200).json({ fallbackToLocalSpeech: true });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PHC-Aid Taraba server listening on http://localhost:${PORT}`);
  });
}

startServer();
