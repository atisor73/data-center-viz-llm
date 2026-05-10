<script>
  const suggestedQuestions = [
    'Which states have the most proposed data centers?',
    'What are some questions I can ask about this map?',
    'Explain why data centers matter for communities.',
  ];

  let open = $state(false);
  let draft = $state('');
  let sending = $state(false);
  let messages = $state([
    {
      role: 'assistant',
      text: 'Hi, I can answer general questions for now. Data-aware answers come next.',
    },
  ]);
  let messagesEl;

  $effect(() => {
    messages.length;
    if (messagesEl) {
      queueMicrotask(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }
  });

  async function sendMessage(text = draft) {
    const message = text.trim();
    if (!message || sending) return;

    messages = [...messages, { role: 'user', text: message }];
    draft = '';
    sending = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'The chat service is unavailable. Please try again.');
      }

      messages = [...messages, { role: 'assistant', text: data.reply || 'No response returned.' }];
    } catch (error) {
      messages = [...messages, { role: 'assistant', text: error.message }];
    } finally {
      sending = false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

{#if !open}
  <button class="chat-bubble" onclick={() => open = true} aria-label="Open chat" title="Open chat">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.2A8 8 0 1 1 21 12Z" />
    </svg>
    Chat
  </button>
{/if}

<aside class="chat-sidebar" class:open>
  <div class="chat-header">
    <div>
      <h2>Chat</h2>
      <p>Gemini 3 Flash</p>
    </div>
    <button class="icon-btn" onclick={() => open = false} aria-label="Close chat">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  <div class="suggestions">
    {#each suggestedQuestions as question}
      <button onclick={() => sendMessage(question)} disabled={sending}>{question}</button>
    {/each}
  </div>

  <div class="messages" bind:this={messagesEl}>
    {#each messages as message}
      <div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
        {message.text}
      </div>
    {/each}
    {#if sending}
      <div class="message assistant">Thinking...</div>
    {/if}
  </div>

  <form class="chat-form" onsubmit={handleSubmit}>
    <textarea
      bind:value={draft}
      onkeydown={handleKeydown}
      placeholder="Ask a question..."
      rows="2"
      disabled={sending}
    ></textarea>
    <button type="submit" disabled={sending || !draft.trim()} aria-label="Send message">
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M3.105 2.289a.75.75 0 0 1 .816-.114l13 6.5a.75.75 0 0 1 0 1.342l-13 6.5A.75.75 0 0 1 2.86 15.7l1.4-5.7-1.4-5.7a.75.75 0 0 1 .245-.811Zm2.49 8.461-.857 3.49L14.91 10 4.738 5.76l.857 3.49H10a.75.75 0 0 1 0 1.5H5.595Z" />
      </svg>
    </button>
  </form>
</aside>

<style>
  .chat-bubble {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 80;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #4a5568;
    border-radius: 999px;
    background: #2563eb;
    color: #fff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    padding: 10px 14px;
  }

  .chat-bubble:hover {
    background: #1d4ed8;
  }

  .chat-bubble svg {
    width: 18px;
    height: 18px;
  }

  .chat-sidebar {
    width: 0;
    min-width: 0;
    overflow: hidden;
    background: #1a1f2e;
    border-left: 1px solid #2d3748;
    display: flex;
    flex-direction: column;
    flex: 0 0 0;
    position: relative;
    z-index: 20;
    transition: width 0.25s ease;
  }

  .chat-sidebar.open {
    width: min(340px, 88vw);
    flex-basis: min(340px, 88vw);
  }

  .chat-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid #2d3748;
  }

  .chat-header h2 {
    color: #e2e8f0;
    font-size: 16px;
    line-height: 1.2;
    margin-bottom: 3px;
  }

  .chat-header p {
    color: #718096;
    font-size: 12px;
  }

  .icon-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
  }

  .icon-btn:hover {
    color: #e2e8f0;
  }

  .icon-btn svg {
    display: block;
    width: 18px;
    height: 18px;
  }

  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #2d3748;
  }

  .suggestions button {
    background: #1e2535;
    border: 1px solid #2d3748;
    border-radius: 6px;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 12px;
    line-height: 1.35;
    overflow-wrap: anywhere;
    padding: 8px 10px;
    text-align: left;
    white-space: normal;
  }

  .suggestions button:hover:not(:disabled) {
    border-color: #4a5568;
    background: #252d40;
    color: #e2e8f0;
  }

  .suggestions button:disabled {
    cursor: wait;
    opacity: 0.55;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .message {
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.45;
    max-width: 88%;
    padding: 9px 11px;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .message.assistant {
    align-self: flex-start;
    background: #1e2535;
    color: #dbe4f0;
    border: 1px solid #2d3748;
  }

  .message.user {
    align-self: flex-end;
    background: #2563eb;
    color: #fff;
  }

  .chat-form {
    display: grid;
    grid-template-columns: 1fr 40px;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #2d3748;
  }

  textarea {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 6px;
    color: #e2e8f0;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.4;
    max-height: 96px;
    min-height: 40px;
    outline: none;
    padding: 8px 10px;
    resize: vertical;
  }

  textarea:focus {
    border-color: #4a90d9;
  }

  textarea::placeholder {
    color: #4a5568;
  }

  .chat-form button {
    align-self: end;
    background: #2563eb;
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    height: 40px;
    display: grid;
    place-items: center;
  }

  .chat-form button:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .chat-form button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .chat-form svg {
    width: 18px;
    height: 18px;
  }

</style>
