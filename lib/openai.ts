import OpenAI from 'openai';

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
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

function generateMockEmail(params: GenerateEmailParams): GeneratedEmail {
  const { leadFirstName, leadLastName, leadEmail, leadMetadata, campaignName, emailNumber } = params;
  const fullName = `${leadFirstName}${leadLastName ? ` ${leadLastName}` : ''}`;
  const company = leadMetadata?.company || 'your company';

  // Generate mock subject based on email number
  const subjects = [
    `Welcome to ${campaignName}, ${leadFirstName}!`,
    `Quick question, ${leadFirstName}`,
    `Following up, ${leadFirstName}`,
    `Exciting update for you, ${leadFirstName}`,
    `Let's connect, ${leadFirstName}`,
  ];
  const subject = subjects[Math.min(emailNumber - 1, subjects.length - 1)] || `Email ${emailNumber} from ${campaignName}`;

  // Generate mock body
  const body = `Hi ${fullName},

${emailNumber === 1 
  ? `Thank you for joining ${campaignName}! We're excited to have you on board.`
  : `I wanted to follow up with you regarding ${campaignName}.`
}

${leadMetadata?.company 
  ? `I noticed you're with ${company} - that's great!`
  : ''
}

We'd love to hear from you and see how we can help.

Best regards,
The ${campaignName} Team`;

  return { subject, body };
}

export async function generateEmailContent(params: GenerateEmailParams): Promise<GeneratedEmail> {
  const { agentPrompt, leadFirstName, leadLastName, leadEmail, leadMetadata, campaignName, emailNumber, totalEmails } = params;

  // Mock mode if no OpenAI API key
  if (!openai || !process.env.OPENAI_API_KEY) {
    console.log(`[Generation] MOCK MODE: Generating email without OpenAI API key`);
    console.log(`[Generation] Recipient: ${leadFirstName}${leadLastName ? ` ${leadLastName}` : ''} (${leadEmail})`);
    return generateMockEmail(params);
  }

  // Real OpenAI generation
  const prompt = `

${agentPrompt}

---

CONTEXT:

- Campaign: ${campaignName}

- This is email ${emailNumber} of ${totalEmails} in the sequence

- Recipient: ${leadFirstName}${leadLastName ? ` ${leadLastName}` : ''} (${leadEmail})

${leadMetadata ? `- Additional info: ${JSON.stringify(leadMetadata)}` : ''}

---

Write a personalized email for this recipient. 

Respond in JSON format with "subject" and "body" fields only.

`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content) as GeneratedEmail;
  } catch (error) {
    console.error('[Generation] OpenAI error, falling back to mock:', error);
    return generateMockEmail(params);
  }
}

