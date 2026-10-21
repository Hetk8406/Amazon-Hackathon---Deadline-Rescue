import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../features/assistant/assistantTypes';
import styles from './ChatPanel.module.css';

export type ChatPanelProps = {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onApproveProposal?: () => void;
  onRejectProposal?: () => void;
  isProposalPending?: boolean;
};

function renderFormattedContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function ChatPanel({
  messages = [],
  onSendMessage,
  onApproveProposal,
  onRejectProposal,
  isProposalPending,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of stream when messages update
  useEffect(() => {
    if (typeof streamEndRef.current?.scrollIntoView === 'function') {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const latestMessage = messages[messages.length - 1];
  const suggestions =
    latestMessage && latestMessage.role === 'assistant' && latestMessage.suggestions
      ? latestMessage.suggestions
      : ['What should I work on next?', "I'm running 30m late", "Why didn't calculus fit?"];

  return (
    <section className={styles.card} aria-labelledby="assistant-heading">
      <div className={styles.header}>
        <h2 id="assistant-heading" className={styles.heading}>
          <span className={styles.assistantAvatar} aria-hidden="true">💬</span>
          Conversational Assistant
        </h2>
        <span className={styles.badge}>Alexa+ Simulated Experience &bull; Local</span>
      </div>

      <div
        className={styles.messageStream}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Deadline Rescue Assistant"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
            >
              <div className={styles.bubbleHeader}>
                {!isUser && <span className={styles.assistantAvatar} aria-hidden="true">⚡</span>}
                <span>{isUser ? 'You' : 'Assistant'}</span>
              </div>

              <div
                className={`${styles.messageBubble} ${
                  isUser ? styles.userBubble : styles.assistantBubble
                }`}
              >
                {renderFormattedContent(msg.content)}

                {msg.showApprovalActions && isProposalPending && onApproveProposal && onRejectProposal && (
                  <div className={styles.inlineActions}>
                    <button
                      type="button"
                      className={styles.approveInlineBtn}
                      onClick={onApproveProposal}
                    >
                      Approve Revised Plan
                    </button>
                    <button
                      type="button"
                      className={styles.rejectInlineBtn}
                      onClick={onRejectProposal}
                    >
                      Keep Current Plan (Reject)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={streamEndRef} />
      </div>

      <div className={styles.suggestionsSection}>
        <div className={styles.suggestionsTitle}>Suggested Prompts</div>
        <div className={styles.suggestionsRow}>
          {suggestions.map((sug, idx) => (
            <button
              key={`${sug}-${idx}`}
              type="button"
              className={styles.suggestionChip}
              onClick={() => handleSuggestionClick(sug)}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      <form className={styles.composerForm} onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          className={styles.input}
          placeholder='Ask a question or report a delay (e.g. "I&#39;m running 30m late")...'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          aria-label="Message to Deadline Rescue assistant"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!inputText.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>

      <div className={styles.disclosure}>
        Alexa+ simulated experience &mdash; running locally in this demo.
      </div>
    </section>
  );
}

export default ChatPanel;
