"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, MessageSquare, Send, User, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Halo! Saya asisten Portal Satu Data. Ada yang bisa saya bantu?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate bot response
    setTimeout(
      () => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: getBotResponse(input),
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botResponse])
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    ) // Random delay between 1-2 seconds
  }

  const getBotResponse = (userInput: string) => {
    const input = userInput.toLowerCase()

    if (input.includes("halo") || input.includes("hai") || input.includes("hi")) {
      return "Halo! Ada yang bisa saya bantu terkait data di Portal Satu Data?"
    }

    if (input.includes("data") || input.includes("dataset")) {
      return "Portal Satu Data menyediakan berbagai dataset dari berbagai kategori seperti demografi, ekonomi, kesehatan, dan lainnya. Anda dapat menggunakan Query Builder untuk membuat kueri data yang Anda butuhkan."
    }

    if (input.includes("grafik") || input.includes("chart") || input.includes("visualisasi")) {
      return "Anda dapat membuat visualisasi data dengan menggunakan fitur Chart Generator. Tersedia berbagai jenis grafik seperti bar chart, line chart, dan pie chart."
    }

    if (input.includes("unduh") || input.includes("download") || input.includes("export")) {
      return "Anda dapat mengunduh data dalam format Excel (CSV), PDF, atau gambar (PNG) dengan mengklik tombol Unduh pada halaman Query Builder atau Data Explorer."
    }

    if (input.includes("bantuan") || input.includes("help") || input.includes("tolong")) {
      return "Saya siap membantu Anda menggunakan Portal Satu Data. Anda dapat bertanya tentang cara menggunakan Query Builder, membuat visualisasi, atau mengunduh data."
    }

    return "Terima kasih atas pertanyaan Anda. Apakah ada hal lain yang ingin Anda ketahui tentang Portal Satu Data?"
  }

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 p-0 shadow-lg transition-all duration-300 hover:scale-110",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90",
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {/* Chat window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-80 md:w-96 transition-all duration-300 transform",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        <Card className="shadow-xl border-primary/10">
          <CardHeader className="bg-primary text-white py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2 border-2 border-white">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Bot" />
                <AvatarFallback className="bg-secondary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">Asisten Portal Satu Data</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-primary/90 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarFallback className="bg-secondary text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn("rounded-lg p-3", message.role === "user" ? "bg-primary text-white" : "bg-muted")}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarFallback className="bg-primary text-white">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarFallback className="bg-secondary text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="rounded-lg p-3 bg-muted">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-secondary animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-secondary animate-bounce [animation-delay:0.2s]" />
                        <div className="h-2 w-2 rounded-full bg-secondary animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <CardFooter className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex w-full items-center space-x-2"
            >
              <Input
                placeholder="Ketik pesan..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-primary hover:bg-primary/90"
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Kirim</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
