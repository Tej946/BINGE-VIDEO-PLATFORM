import React, { useState } from 'react';
import { Bot, Send, Sparkles, Film, ShieldCheck } from 'lucide-react';
import VideoCard from './VideoCard';

export default function AIAssistantView({
  videos = [],
  spaces = [],
  savedVideos = [],
  onPlayVideo,
  onToggleSave,
  onSelectCreator,
  onSelectSpace
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I'm the BINGE Privacy-First Assistant. I can help you discover videos, find creators, query your Spaces, or recommend a custom viewing session — completely on-device without behavioral tracking.",
      suggestedVideos: []
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');

  const quickPrompts = [
    "Find videos on cinematography",
    "Show me quick videos under 10 minutes",
    "What are the top rated videos by views?",
    "Explain BINGE's zero-algorithm privacy architecture"
  ];

  const handleSendPrompt = (promptText) => {
    const text = promptText || inputPrompt;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');

    // Process deterministic query
    setTimeout(() => {
      const q = text.toLowerCase();
      let responseText = '';
      let matchedVideos = [];

      if (q.includes('privacy') || q.includes('tracking') || q.includes('algorithm')) {
        responseText =
          "BINGE is engineered with zero behavioral tracking. Unlike YouTube, there is no black-box recommendation algorithm tracking your watch history or emotional state. Spaces are completely created and curated by you, and playback is streamed via lean direct HTTP 206 range requests.";
      } else if (q.includes('under 10') || q.includes('short') || q.includes('quick')) {
        matchedVideos = videos.filter((v) => (v.duration || 0) < 600);
        responseText = `Found ${matchedVideos.length} quick videos under 10 minutes in your library:`;
      } else if (q.includes('top') || q.includes('most viewed') || q.includes('views')) {
        matchedVideos = [...videos].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 3);
        responseText = "Here are the top-viewed videos currently in your library:";
      } else if (q.includes('spaces') || q.includes('categories')) {
        responseText = `You currently have ${spaces.length} Spaces available. Remember, Spaces are completely user-created (not fixed categories). You can organize videos into any custom space you desire!`;
      } else {
        // Keyword match across titles, descriptions, creators, tags
        matchedVideos = videos.filter(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            (v.description && v.description.toLowerCase().includes(q)) ||
            (v.creator_name && v.creator_name.toLowerCase().includes(q)) ||
            (v.tags && v.tags.toLowerCase().includes(q))
        );
        if (matchedVideos.length > 0) {
          responseText = `Found ${matchedVideos.length} videos matching your query:`;
        } else {
          matchedVideos = videos.slice(0, 3);
          responseText =
            "I couldn't find an exact keyword match, but here are some popular library selections you can explore:";
        }
      }

      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: responseText,
        suggestedVideos: matchedVideos.slice(0, 3)
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 400);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={28} color="var(--accent-cyan)" />
          <span>BINGE AI Assistant</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
          Local discovery assistant. Ask natural language questions about your library without any privacy loss.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="filter-chips-bar" style={{ marginBottom: '18px' }}>
        {quickPrompts.map((p) => (
          <button
            key={p}
            className="filter-chip"
            onClick={() => handleSendPrompt(p)}
          >
            <Sparkles size={13} style={{ marginRight: '6px', color: 'var(--accent-cyan)' }} />
            {p}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="assistant-container">
        <div className="assistant-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble ${
                msg.sender === 'assistant' ? 'chat-bubble-assistant' : 'chat-bubble-user'
              }`}
            >
              <p>{msg.text}</p>

              {/* Suggested Video Cards */}
              {msg.suggestedVideos && msg.suggestedVideos.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '12px',
                    marginTop: '14px'
                  }}
                >
                  {msg.suggestedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isSaved={savedVideos.some((v) => v.id === video.id)}
                      onToggleSave={onToggleSave}
                      onPlayVideo={onPlayVideo}
                      onSelectCreator={onSelectCreator}
                      onSelectSpace={onSelectSpace}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(inputPrompt);
          }}
        >
          <input
            type="text"
            className="form-input"
            style={{ borderRadius: 'var(--radius-full)' }}
            placeholder="Ask anything about the video library, topics, or privacy..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
