import { useState, useRef, useEffect } from "react";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { useNotification } from "../../context/NotificationContext";

/**
 * ChatbotMF - AI Assistant Chat Micro-Frontend
 * Provides conversational AI interface for answering questions about community issues
 *
 * Features:
 * - Real-time chat interface with user/bot message distinction
 * - Lazy-loaded GraphQL queries (questions sent on-demand)
 * - Auto-scroll to latest message
 * - Loading indicator while awaiting AI response
 * - Error handling with user notifications
 * - Accessible chat log with ARIA attributes
 *
 * @component
 * @returns {JSX.Element} Chat interface with input and message history
 */

// GraphQL query: Send question to AI agent and get response
// Uses lazy query to minimize unnecessary requests
// Returns: agentAnswer (string) - AI-generated response text
const AGENT_ANSWER = gql`
  query AgentAnswer($question: String!) {
    agentAnswer(question: $question)
  }
`;

export default function ChatbotMF() {
  // Message history: array of { role: 'user'|'bot', text: string }
  // Initialize with welcome message
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Ask me anything about community issues." },
  ]);

  // Current input field value
  const [input, setInput] = useState("");

  // Ref to chat bottom for auto-scroll behavior
  const bottomRef = useRef(null);

  // Notification system for error feedback
  const { showNotification } = useNotification();

  const lastAnswerRef = useRef("");

  const [ask, { loading }] = useLazyQuery(AGENT_ANSWER, {
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");

    try {
      const { data } = await ask({ variables: { question } });
      const answer = data?.agentAnswer ?? "Sorry, I could not get a response.";
      setMessages((m) => [...m, { role: "bot", text: answer }]);
    } catch (err) {
      showNotification("Error getting response: " + err.message, "error");
      setMessages((m) => [...m, { role: "bot", text: "Sorry, something went wrong." }]);
    }
  };

  const CHAT_INPUT_LABEL = "Ask a question"; // Label for screen readers

  return (
    <section
      aria-label="AI Assistant chat"
      className="bg-white rounded-xl shadow-md flex flex-col h-[520px]"
    >
      {/* Chat header */}
      <div className="px-5 py-4 border-b">
        <h1 className="font-semibold text-gray-800 text-sm">AI Assistant</h1>
      </div>

      {/* Chat message history */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Message bubble: different styles for user vs bot */}
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {/* Screen reader context */}
              <span className="sr-only">
                {msg.role === "user" ? "You: " : "Assistant: "}
              </span>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading indicator while waiting for response */}
        {loading && (
          <div className="flex justify-start" aria-live="polite">
            <div
              className="bg-gray-100 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-sm text-sm"
              aria-label="Assistant is thinking"
            >
              Thinking...
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Message input form */}
      <form onSubmit={send} className="px-5 py-4 border-t flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          {CHAT_INPUT_LABEL}
        </label>
        <input
          id="chat-input"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder={CHAT_INPUT_LABEL}
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
