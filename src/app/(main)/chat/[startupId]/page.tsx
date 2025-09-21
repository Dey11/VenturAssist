"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";
import MarkdownRenderer from "@/components/ui/markdown-renderer";

const suggestions = [
  "Summarize the risks in simple terms.",
  "If I invest $500K, what’s the likely runway?",
];

interface Startup {
  id: string;
  name: string;
  description: string | null;
  overallStatus: string;
  updatedAt: string;
}

const page = () => {
  const params = useParams();
  const router = useRouter();
  const startupId = params.startupId as string;
  
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [isLoadingStartups, setIsLoadingStartups] = useState(true);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const response = await fetch('/api/startup');
        if (response.ok) {
          const data = await response.json();
          setStartups(data);
          
          const currentStartup = data.find((startup: Startup) => startup.id === startupId);
          setSelectedStartup(currentStartup || null);
        }
      } catch (error) {
        console.error('Error fetching startups:', error);
      } finally {
        setIsLoadingStartups(false);
      }
    };

    fetchStartups();
  }, [startupId]);

  const handleStartupChange = (newStartupId: string) => {
    if (newStartupId !== startupId) {
      setMessages([]);
      router.push(`/chat/${newStartupId}`);
    }
  };

  const sendMessageToAPI = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: message }],
          startupId: startupId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('Error sending message:', error);
      return "Sorry, I encountered an error while processing your message. Please try again.";
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    
    const userMessage = { role: "user" as const, content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantReply = await sendMessageToAPI(trimmed);
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantReply }]);
    } catch (error) {
      console.error('Error in handleSend:', error);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen rounded-lg px-5">
      <div className="flex h-[80vh] flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="font-platypi text-brand-primary text-5xl font-medium">
              DealScope
            </div>
            <div className="font-dmsans text-brand-secondary max-w-xl text-2xl">
              Ask follow-up questions or dive deeper into your startup analysis.
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 space-y-4 overflow-y-auto py-6">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === "user" ? "bg-brand-accent rounded-br-sm text-black" : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"}`}
                >
                  {m.role === "user" ? m.content : <MarkdownRenderer content={m.content} />}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex h-[10vh] items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="font-dmsans text-brand-secondary text-sm">
            Suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`rounded-2xl px-4 py-2 text-white hover:cursor-pointer ${
                  isLoading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-brand-primary hover:bg-brand-primary/90"
                }`}
                onClick={() => !isLoading && setInput(s)}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-[300px]">
            <Select
              value={startupId}
              onValueChange={handleStartupChange}
              disabled={isLoadingStartups}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingStartups ? "Loading startups..." : "Select a startup"}>
                  {selectedStartup ? selectedStartup.name : "Select a startup"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {startups.map((startup) => (
                  <SelectItem key={startup.id} value={startup.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{startup.name}</span>
                      {startup.description && (
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {startup.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="mx-auto flex h-[10vh] items-center gap-2">
        <Input
          placeholder={isLoading ? "AI is thinking..." : "Type your message"}
          className="h-12"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          variant="default"
          className="bg-brand-primary hover:bg-brand-primary/90 h-12 w-12 disabled:opacity-50"
          aria-label="Send message"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default page;
