import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: For edge runtime optimization

export async function POST(req: Request) {
  const { message } = await req.json();
  const AWANLLM_API_KEY = 'b6055715-c1d5-4d50-a764-9bc2817992bd';

  try {
    const response = await fetch("https://api.awanllm.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AWANLLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Meta-Llama-3-8B-Instruct",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        stream: true
      })
    });

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const _error = error; // Use _error instead of error
    return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
    );
}

}
