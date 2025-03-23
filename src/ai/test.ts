const response = await fetch("https://api.awanllm.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AWANLLM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "Meta-Llama-3-8B-Instruct",
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
      ],
      "stream": true
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
    console.log(result); // Process streamed response here
  }
  