import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

interface GenerateEmailParams {
  agentPrompt: string;
  leadFirstName: string;
  leadLastName?: string;
  leadEmail: string;
  leadMetadata?: Record<string, any>;
  campaignName: string;
  emailNumber: number;
  totalEmails: number;
  senderName: string;
  companyName?: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

function generateMockEmail(params: GenerateEmailParams): GeneratedEmail {
  const {
    leadFirstName,
    leadLastName,
    leadEmail,
    leadMetadata,
    campaignName,
    emailNumber,
    senderName,
    companyName = "GURD",
  } = params;
  const fullName = `${leadFirstName}${leadLastName ? ` ${leadLastName}` : ""}`;
  const company = leadMetadata?.company || "your company";

  // Generate mock subject based on email number
  const subjects = [
    `Welcome to ${campaignName}, ${leadFirstName}!`,
    `Quick question, ${leadFirstName}`,
    `Following up, ${leadFirstName}`,
    `Exciting update for you, ${leadFirstName}`,
    `Let's connect, ${leadFirstName}`,
  ];
  const subject =
    subjects[Math.min(emailNumber - 1, subjects.length - 1)] ||
    `Email ${emailNumber} from ${campaignName}`;

  // Generate mock body with sender name and company
  const body = `Hi ${fullName},

${
  emailNumber === 1
    ? `Thank you for joining ${campaignName}! We're excited to have you on board.`
    : `I wanted to follow up with you regarding ${campaignName}.`
}

${
  leadMetadata?.company
    ? `I noticed you're with ${company} - that's great!`
    : ""
}

We'd love to hear from you and see how we can help.

Best regards,

${senderName}
${companyName}`;

  return { subject, body };
}

export async function generateEmailContent(
  params: GenerateEmailParams
): Promise<GeneratedEmail> {
  const {
    agentPrompt,
    leadFirstName,
    leadLastName,
    leadEmail,
    leadMetadata,
    campaignName,
    emailNumber,
    totalEmails,
    senderName,
    companyName = "GURD",
  } = params;

  // Mock mode if no OpenAI API key
  if (!openai || !process.env.OPENAI_API_KEY) {
    console.log(
      `[Generation] MOCK MODE: Generating email without OpenAI API key`
    );
    console.log(
      `[Generation] Recipient: ${leadFirstName}${
        leadLastName ? ` ${leadLastName}` : ""
      } (${leadEmail})`
    );
    return generateMockEmail(params);
  }

  console.log(
    `[Generation] Using OpenAI API to generate email for ${leadFirstName} ${
      leadLastName || ""
    }`
  );

  // Real OpenAI generation with improved prompt
  const fullName = `${leadFirstName}${leadLastName ? ` ${leadLastName}` : ""}`;
  const metadataString = leadMetadata
    ? Object.entries(leadMetadata)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join("\n")
    : "None";

  const systemPrompt = `You are an AI email writing assistant. Your role is to write personalized, professional emails based on the agent's instructions.

IMPORTANT RULES:
1. Write in a natural, conversational tone
2. Keep emails concise (2-3 short paragraphs max)
3. Always personalize using the recipient's name and information
4. Include a clear call-to-action
5. Sign off professionally with the sender's name and company
6. Respond ONLY with valid JSON containing "subject" and "body" fields
7. Do not include any markdown formatting in the email body
8. Use proper line breaks for readability
9. Always end emails with the provided sender signature`;

  const userPrompt = `AGENT INSTRUCTIONS:
${agentPrompt}

CAMPAIGN CONTEXT:
- Campaign Name: ${campaignName}
- Email Sequence: This is email #${emailNumber} out of ${totalEmails} total emails
- Email Purpose: ${
    emailNumber === 1
      ? "Introduction/First contact"
      : emailNumber === totalEmails
      ? "Final follow-up"
      : "Follow-up/Nurture"
  }

SENDER INFORMATION:
- Sender Name: ${senderName}
- Company: ${companyName}

RECIPIENT INFORMATION:
- Name: ${fullName}
- Email: ${leadEmail}
- Additional Info:
${metadataString}

TASK:
Write a personalized email for ${fullName} following the agent instructions above. 
Consider this is email ${emailNumber} of ${totalEmails} in the sequence.
${
  emailNumber === 1
    ? "This is the first email, so introduce yourself/your company."
    : ""
}
${
  emailNumber > 1
    ? "This is a follow-up email, so reference previous communication naturally."
    : ""
}

IMPORTANT: End the email with:

Best regards,

${senderName}
${companyName}

Respond with a JSON object containing:
- "subject": A compelling subject line (50 characters or less)
- "body": The email body (2-3 short paragraphs, include line breaks for readability, must end with sender signature)`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for faster and cheaper generation
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const generated = JSON.parse(content) as GeneratedEmail;

    // Validate response
    if (!generated.subject || !generated.body) {
      throw new Error("Invalid response format from OpenAI");
    }

    console.log(`[Generation] ✅ Email generated successfully via OpenAI`);
    console.log(`[Generation] Subject: ${generated.subject}`);

    return generated;
  } catch (error) {
    console.error(
      "[Generation] OpenAI error:",
      error instanceof Error ? error.message : error
    );
    console.log("[Generation] Falling back to mock email generation");
    return generateMockEmail(params);
  }
}
