<script>
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  let { onShowResult = () => {}, onApplyFilters = () => {} } = $props();

  const historyLimit = 10;
  const minSidebarWidth = 280;
  const maxSidebarWidth = 720;
  const initialMessages = [
    {
      role: 'assistant',
      text: 'Hi! Ask me anything about the data center dataset. I can help you explore the data with SQL queries, filter the dashboard by status, or search by keyword.',
    },
  ];

  let open = $state(false);
  let draft = $state('');
  let sending = $state(false);
  let listening = $state(false);
  let resizing = $state(false);
  let sidebarWidth = $state(400);
  let messages = $state([...initialMessages]);
  let messagesEl;
  let inputEl;
  let recognition;
  let voiceBaseDraft = '';
  let startX = 0;
  let startWidth = 400;

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

    const nextMessages = [...messages, { role: 'user', text: message }];
    messages = nextMessages;
    draft = '';
    sending = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages
            .slice(-historyLimit)
            .map(({ role, text }) => ({ role, text })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'The chat service is unavailable. Please try again.');
      }

      if (data.filter) {
        onApplyFilters(data.filter);
      }

      messages = [...messages, {
        role: 'assistant',
        text: data.reply || 'No response returned.',
        result: data.result,
      }];
    } catch (error) {
      messages = [...messages, { role: 'assistant', text: error.message }];
    } finally {
      sending = false;
      queueMicrotask(() => inputEl?.focus());
    }
  }

  function clearHistory() {
    messages = [...initialMessages];
    draft = '';
    onShowResult(null);
  }

  function clampWidth(width) {
    return Math.min(maxSidebarWidth, Math.max(minSidebarWidth, width));
  }

  function handleResizeMove(event) {
    sidebarWidth = clampWidth(startWidth - (event.clientX - startX));
  }

  function stopResize() {
    resizing = false;
    document.body.classList.remove('chat-resizing');
    window.removeEventListener('pointermove', handleResizeMove);
    window.removeEventListener('pointerup', stopResize);
  }

  function startResize(event) {
    event.preventDefault();
    startX = event.clientX;
    startWidth = sidebarWidth;
    resizing = true;
    document.body.classList.add('chat-resizing');
    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', stopResize);
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

  function stopVoiceInput() {
    recognition?.stop();
  }

  function toggleVoiceInput() {
    if (listening) {
      stopVoiceInput();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      voiceBaseDraft = draft.trim();
      listening = true;
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      transcript = transcript.trim();
      if (transcript) {
        draft = [voiceBaseDraft, transcript].filter(Boolean).join(' ');
      }
      queueMicrotask(() => inputEl?.focus());
    };

    recognition.onend = () => {
      listening = false;
      queueMicrotask(() => inputEl?.focus());
    };

    recognition.onerror = () => {
      listening = false;
    };

    recognition.start();
  }

  function renderMarkdown(text) {
    return DOMPurify.sanitize(marked.parse(text));
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

<aside
  class="chat-sidebar"
  class:open
  class:resizing
  style:width={open ? `${sidebarWidth}px` : '0px'}
  style:flex-basis={open ? `${sidebarWidth}px` : '0px'}
>
  {#if open}
    <button class="resize-handle" onpointerdown={startResize} aria-label="Resize chat sidebar"></button>
  {/if}

  <div class="chat-header">
    <div>
      <h2>Chat</h2>
      <p>Gemini 3.1 Flash Lite</p>
    </div>
    <div class="header-actions">
      <button class="clear-btn" onclick={clearHistory} disabled={sending}>Clear</button>
      <button class="icon-btn" onclick={() => open = false} aria-label="Close chat">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>

  <div class="messages" bind:this={messagesEl}>
    {#each messages as message}
      <div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
        {#if message.role === 'assistant'}
          <div class="markdown">
            {@html renderMarkdown(message.text)}
          </div>
          {#if message.result}
            <button class="result-btn" onclick={() => onShowResult(message.result)}>
              View SQL and results
            </button>
          {/if}
        {:else}
          {message.text}
        {/if}
      </div>
    {/each}
    {#if sending}
      <div class="message assistant">Thinking...</div>
    {/if}
  </div>

  <form class="chat-form" onsubmit={handleSubmit}>
    <textarea
      bind:this={inputEl}
      bind:value={draft}
      onkeydown={handleKeydown}
      placeholder="How many data centers are there in Illinois?"
      rows="2"
      disabled={sending}
    ></textarea>
    <button
      type="button"
      class:active={listening}
      disabled={sending}
      onclick={toggleVoiceInput}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      title={listening ? 'Stop voice input' : 'Start voice input'}
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12.5a3 3 0 0 0 3-3v-4a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z" />
        <path d="M4.75 9.5a.75.75 0 0 1 1.5 0 3.75 3.75 0 0 0 7.5 0 .75.75 0 0 1 1.5 0 5.25 5.25 0 0 1-4.5 5.19v1.56h2a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5h2v-1.56A5.25 5.25 0 0 1 4.75 9.5Z" />
      </svg>
    </button>
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

  .chat-sidebar.resizing {
    transition: none;
  }

  :global(body.chat-resizing) {
    cursor: col-resize;
    user-select: none;
  }

  .resize-handle {
    position: absolute;
    top: 0;
    left: -4px;
    bottom: 0;
    width: 8px;
    background: transparent;
    border: 0;
    cursor: col-resize;
    padding: 0;
    z-index: 3;
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .clear-btn {
    background: #1e2535;
    border: 1px solid #2d3748;
    border-radius: 4px;
    color: #a0aec0;
    cursor: pointer;
    font-size: 11px;
    padding: 4px 8px;
  }

  .clear-btn:hover:not(:disabled) {
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .clear-btn:disabled {
    cursor: wait;
    opacity: 0.5;
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

  .markdown :global(p) {
    margin: 0 0 8px;
  }

  .markdown :global(p:last-child),
  .markdown :global(ul:last-child),
  .markdown :global(ol:last-child),
  .markdown :global(pre:last-child) {
    margin-bottom: 0;
  }

  .markdown :global(ul),
  .markdown :global(ol) {
    margin: 0 0 8px 18px;
    padding: 0;
  }

  .markdown :global(li) {
    margin: 3px 0;
  }

  .markdown :global(a) {
    color: #90cdf4;
  }

  .markdown :global(code) {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 4px;
    color: #f6ad55;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    padding: 1px 4px;
  }

  .markdown :global(pre) {
    background: #0f1117;
    border: 1px solid #2d3748;
    border-radius: 6px;
    margin: 0 0 8px;
    max-width: 100%;
    overflow-x: auto;
    padding: 8px;
  }

  .markdown :global(pre code) {
    background: transparent;
    border: 0;
    color: #e2e8f0;
    display: block;
    padding: 0;
    white-space: pre;
  }

  .markdown :global(strong) {
    color: #f8fafc;
  }

  .result-btn {
    background: #1e2535;
    border: 1px solid #4a5568;
    border-radius: 4px;
    color: #90cdf4;
    cursor: pointer;
    font-size: 12px;
    margin-top: 8px;
    padding: 5px 8px;
  }

  .result-btn:hover {
    border-color: #63b3ed;
    color: #bee3f8;
  }

  .chat-form {
    display: grid;
    grid-template-columns: 1fr 40px 40px;
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

  .chat-form button.active {
    background: #dc2626;
    opacity: 1;
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
