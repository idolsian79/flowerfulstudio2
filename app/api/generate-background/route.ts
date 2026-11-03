export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      prompt?: string;
      size?: string;
      apiKey?: string;
    };
    const apiKey = process.env.OPENAI_API_KEY || body.apiKey;
    if (!apiKey) {
      return Response.json(
        { error: "Add an OpenAI API key to generate backgrounds inside the app." },
        { status: 401 },
      );
    }
    if (!body.prompt || body.prompt.length > 5000) {
      return Response.json({ error: "The background direction is invalid." }, { status: 400 });
    }
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: body.prompt,
        size: body.size || "1024x1024",
        quality: "medium",
      }),
    });
    const result = await response.json() as {
      data?: Array<{ b64_json?: string }>;
      error?: { message?: string };
    };
    if (!response.ok || !result.data?.[0]?.b64_json) {
      return Response.json(
        { error: result.error?.message || "OpenAI could not create this background." },
        { status: response.status || 500 },
      );
    }
    return Response.json({ image: result.data[0].b64_json });
  } catch {
    return Response.json({ error: "Background generation failed. Please try again." }, { status: 500 });
  }
}
