import { useState, useRef, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import { useNotification } from '../../context/NotificationContext';

const AGENT_ANSWER = gql`
  query AgentAnswer($question: String!) {
    agentAnswer(question: $question)
  }
`;

export default function ChatbotMF() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! Ask me anything about community issues.' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const { showNotification } = useNotification();

  const [ask, { loading }] = useLazyQuery(AGENT_ANSWER, {
    onCompleted: (data) => {
      setMessages((m) => [...m, { role: 'bot', text: data.agentAnswer }]);
    },
    onError: (err) => {
      setMessages((m) => [...m, { role: 'bot', text: `Error: ${err.message}` }]);
      showNotification('Failed to get response', 'error');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: input }]);
    ask({ variables: { question: input } });
    setInput('');
  };

  return (
    <section aria-label="AI Assistant chat" className="bg-white rounded-xl shadow-md flex flex-col h-[520px]">
      <div className="px-5 py-4 border-b">
        <h1 className="font-semibold text-gray-800 text-sm">AI Assistant</h1>
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              <span className="sr-only">{msg.role === 'user' ? 'You: ' : 'Assistant: '}</span>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start" aria-live="polite">
            <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-sm text-sm" aria-label="Assistant is thinking">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="px-5 py-4 border-t flex gap-2">
        <label htmlFor="chat-input" className="sr-only">Ask a question</label>
        <input
          id="chat-input"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
