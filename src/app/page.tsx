'use client';
import { useState } from 'react';

interface Message {
  role: string;
  content: string;
}

export default function LLMStreamer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Add user message immediately
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      setInput('');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n');

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line) continue;
          
          if (line === 'data: [DONE]') {
            buffer = '';
            break;
          }

          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              const parsed = JSON.parse(jsonStr);
              
              if (parsed.choices[0].delta.content) {
                assistantContent += parsed.choices[0].delta.content;
                
                // Optimized state update
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = assistantContent;
                    return newMessages;
                  }
                  return [...prev, { role: 'assistant', content: assistantContent }];
                });
              }
            } catch (e) {
              console.error('Error parsing JSON:', line, e);
            }
          }
        }

        // Keep incomplete chunk for next iteration
        buffer = chunks[chunks.length - 1];
      }
    } catch (error) {
      console.error('Stream error:', error);
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`text-black p-4 rounded-lg ${
            msg.role === 'user' ? 'bg-blue-100 ml-auto' :
            msg.role === 'error' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
