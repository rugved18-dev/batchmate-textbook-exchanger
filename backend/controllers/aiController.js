const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Note } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Initialise Gemini client lazily so missing API key doesn't crash server on boot
let genAI = null;
const getGenAI = () => {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            throw new AppError('AI summarisation is not configured (missing GEMINI_API_KEY)', 503);
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

const SUMMARY_PROMPT = `You are an academic assistant helping engineering students understand lecture notes.
Analyse this PDF note and provide exactly 5 concise bullet points (each starting with •) that summarise:
1. The main topic / subject area
2. Key concepts covered
3. Important formulas or definitions (if any)
4. Practical applications mentioned
5. What a student should focus on most

Keep each bullet under 25 words. Reply ONLY with the 5 bullets, nothing else.`;

/**
 * @desc    Generate (or return cached) AI summary for a note
 * @route   POST /api/notes/:id/summarize
 * @access  Private
 */
const summarizeNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id).select(
        'title fileUrl aiSummary aiSummaryGeneratedAt uploadedBy'
    );

    if (!note) throw new AppError('Note not found', 404);

    // ── Return cached summary if it exists and is <24 h old ──────────────────
    if (note.aiSummary && note.aiSummaryGeneratedAt) {
        const age = Date.now() - note.aiSummaryGeneratedAt.getTime();
        const hoursOld = age / (1000 * 60 * 60);
        if (hoursOld < 24) {
            return res.status(200).json({
                success: true,
                cached: true,
                summary: note.aiSummary
            });
        }
    }

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const ai = getGenAI();
    // gemini-1.5-flash supports inline PDF via URL
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Fetch the PDF as base64 from the Cloudinary URL
    const pdfResponse = await fetch(note.fileUrl);
    if (!pdfResponse.ok) {
        throw new AppError('Could not fetch PDF from storage', 502);
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64
            }
        },
        { text: SUMMARY_PROMPT }
    ]);

    const rawText = result.response.text().trim();

    // Validate the model returned bullets
    const bullets = rawText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('•') || l.match(/^[\-\*\d\.\•]/));

    const summary = bullets.length >= 3 ? bullets.join('\n') : rawText;

    // ── Cache in DB ───────────────────────────────────────────────────────────
    note.aiSummary = summary;
    note.aiSummaryGeneratedAt = new Date();
    await note.save();

    res.status(200).json({
        success: true,
        cached: false,
        summary
    });
});

module.exports = { summarizeNote };
