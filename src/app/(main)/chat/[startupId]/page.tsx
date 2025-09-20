"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal } from "lucide-react";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const suggestions = [
  "Summarize the risks in simple terms.",
  "If I invest $500K, what’s the likely runway?",
];

const page = () => {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === "user" ? "bg-brand-accent rounded-br-sm text-white" : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"}`}
                >
                  {m.content}
                </div>
              </div>
            ))}
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
                className="bg-brand-primary rounded-2xl px-4 py-2 text-white hover:cursor-pointer"
                onClick={() => setInput(s)}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Startup" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EcoCharge">EcoCharge</SelectItem>
              <SelectItem value="Tesla">Tesla</SelectItem>
              <SelectItem value="Apple">Apple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mx-auto flex h-[10vh] items-center gap-2">
        <Input
          placeholder="Type your message"
          className="h-12"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          variant="default"
          className="bg-brand-primary hover:bg-brand-primary/90 h-12 w-12"
          aria-label="Send message"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default page;
