import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, MapPin, GraduationCap, Book } from "lucide-react";

const suggestedQuestions = [
  { icon: MapPin, text: "Where is CSE Department?" },
  { icon: GraduationCap, text: "Who teaches Machine Learning?" },
  { icon: Book, text: "Navigate to library" },
];

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! I'm your Campus AI Assistant. Ask me anything about faculty, rooms, departments, or navigation.", isUser: false },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const newUserMessage: Message = {
      id: messages.length + 1,
      text: messageText,
      isUser: true,
    };

    setMessages([...messages, newUserMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: getAIResponse(messageText),
        isUser: false,
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes("cse") || q.includes("computer science")) {
      return "The CSE Department is located in Block A, Floors 3-5. The main office is in Room 301. Would you like me to navigate you there?";
    }
    if (q.includes("machine learning") || q.includes("ml")) {
      return "Dr. Sarah Chen teaches Machine Learning (CS 501). Her office is Room 302, Block A, 3rd Floor. Office hours: Mon & Wed, 2-4 PM.";
    }
    if (q.includes("library")) {
      return "The Main Library is in Building D, Central Campus. It has 4 floors with study rooms, computer labs, and a café. Open 8 AM - 10 PM daily.";
    }
    return "I can help you find faculty members, rooms, departments, or navigate anywhere on campus. Try asking about a specific location or person!";
  };

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Campus AI</h1>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-fade-up`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}

          {/* Suggested Questions (show only at start) */}
          {messages.length === 1 && (
            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                Try asking
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q.text)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:bg-secondary/50 transition-all text-left"
                  >
                    <q.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about faculty, rooms, or directions..."
              className="flex-1 h-12 px-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()}
              disabled={!input.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}


