"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@/app/components/Editor";
import ReactMarkdown from "react-markdown";
import { initialBody } from "@/initialBody";
import { QRCodeSVG } from "qrcode.react";
import Peer from "peerjs";
import ShareQRCode from "@/app/components/ShareQRCode";
import Link from "next/link";

interface Document {
  id: string;
  name: string;
  content: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatPopupProps {
  onClose: () => void;
  openAIKey: string;
  setOpenAIKey: (key: string) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isLoading: boolean;
  sendMessage: (message: string) => void;
}

const ChatPopup = ({
  onClose,
  openAIKey,
  setOpenAIKey,
  messages,
  setMessages,
  inputMessage,
  setInputMessage,
  isLoading,
  sendMessage,
}: ChatPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [inputKey, setInputKey] = useState(openAIKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Scroll on new messages or loading state change

  const handleSaveKey = () => {
    setOpenAIKey(inputKey);
    localStorage.setItem("openai-api-key", inputKey);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[150] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border border-gray-200 z-[200] w-[800px] h-[600px] max-w-[90vw] max-h-[90vh] flex flex-col transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Snippet AI</h3>
              <p className="text-xs text-gray-500">Powered by GPT-4o-mini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear the chat history?"
                    )
                  ) {
                    setMessages([]);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                title="Clear chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {!openAIKey ? (
          // API Key Input View
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enter your OpenAI API Key
                </h3>
                <p className="text-sm text-gray-600">
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="api-key"
                  className="block text-sm font-medium text-gray-700"
                >
                  API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500">
                  Don&apos;t have an API key? Get one from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    OpenAI&apos;s website
                  </a>
                </p>
              </div>
              <button
                onClick={handleSaveKey}
                disabled={!inputKey.startsWith("sk-")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Save API Key
              </button>
            </div>
          </div>
        ) : (
          // Chat Interface
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xl">🤖</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-w-[80%]">
                    Hi! I&apos;m your AI writing assistant. I can help you:
                    <ul className="list-disc ml-4 mt-2 space-y-1.5">
                      <li>Improve your writing</li>
                      <li>Generate ideas</li>
                      <li>Fix grammar and style</li>
                      <li>Restructure your content</li>
                      <li>Ask questions about your document</li>
                    </ul>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                        message.role === "assistant"
                          ? "bg-blue-500"
                          : "bg-gray-200"
                      }`}
                    >
                      <span className="text-white text-xl">
                        {message.role === "assistant" ? "🤖" : "👤"}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg p-4 text-sm text-gray-700 max-w-[80%] overflow-hidden ${
                        message.role === "assistant"
                          ? "bg-gray-50"
                          : "bg-blue-50"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc ml-4 mb-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal ml-4 mb-2">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">{children}</li>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-gray-100 p-2 rounded-md my-2 overflow-x-auto">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputMessage);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default function Home() {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "Untitled Document", content: initialBody },
  ]);
  const [activeDocId, setActiveDocId] = useState("1");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [openAIKey, setOpenAIKey] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [starsCount, setStarsCount] = useState<number | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [sharedContent, setSharedContent] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSharedContent(
        localStorage.getItem(`snippet-content-${activeDocId}`) || ""
      );
    }
  }, [activeDocId]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  useEffect(() => {
    // Fetch GitHub stars count
    fetch("https://api.github.com/repos/avayyyyyyy/snippet.today")
      .then((response) => response.json())
      .then((data) => {
        setStarsCount(data.stargazers_count);
      })
      .catch((error) => {
        console.error("Error fetching stars count:", error);
      });
  }, []);

  useEffect(() => {
    const savedContent = localStorage.getItem(`snippet-content-${activeDocId}`);
    if (savedContent && savedContent !== "<p></p>") {
      // Create a temporary div to parse HTML and get text content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = savedContent;
      const text = tempDiv.textContent || tempDiv.innerText || "";

      // Count words and characters
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const characters = text.length;

      // Update state
      setWordCount(words);
      setCharCount(characters);
    }
  }, [activeDocId]); // Re-run when active document changes

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem(`snippet-chat-${activeDocId}`);
      setMessages(savedMessages ? JSON.parse(savedMessages) : []);
    }
  }, [activeDocId]);

  useEffect(() => {
    localStorage.setItem(
      `snippet-chat-${activeDocId}`,
      JSON.stringify(messages)
    );
  }, [messages, activeDocId]);

  const handleWordCountChange = (words: number, characters: number) => {
    setWordCount(words);
    setCharCount(characters);
  };

  const createNewDocument = () => {
    const newDoc = {
      id: Date.now().toString(),
      name: "Untitled Document",
      content: initialBody,
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newDoc.id);
    // Save the initial content to localStorage
    localStorage.setItem(`snippet-content-${newDoc.id}`, initialBody);
  };

  const deleteDocument = (id: string) => {
    if (documents.length === 1) return; // Prevent deleting the last document

    // Remove document content and chat history from localStorage
    localStorage.removeItem(`snippet-content-${id}`);
    localStorage.removeItem(`snippet-chat-${id}`);

    const newDocs = documents.filter((doc) => doc.id !== id);
    setDocuments(newDocs);
    if (activeDocId === id) {
      setActiveDocId(newDocs[0].id);
    }
  };

  const startRenaming = (id: string, currentName: string) => {
    setIsRenaming(id);
    setNewFileName(currentName);
  };

  const handleRename = (id: string) => {
    if (newFileName.trim()) {
      // Get the old document name
      const oldContent = localStorage.getItem(`snippet-content-${id}`);

      // Update documents array
      setDocuments(
        documents.map((doc) =>
          doc.id === id ? { ...doc, name: newFileName.trim() } : doc
        )
      );

      // Update localStorage content key if content exists
      if (oldContent) {
        localStorage.setItem(`snippet-content-${id}`, oldContent);
      }
    }
    setIsRenaming(null);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const exportAsMarkdown = () => {
    if (typeof window === "undefined") return;

    const content = localStorage.getItem(`snippet-content-${activeDocId}`);
    if (content) {
      // Convert HTML to Markdown
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      // Basic HTML to Markdown conversion with proper formatting
      let markdown = content
        // Headers
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        // Lists
        .replace(/<ul[^>]*>(.*?)<\/ul>/gi, "$1\n")
        .replace(/<ol[^>]*>(.*?)<\/ol>/gi, "$1\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "* $1\n")
        // Paragraphs and line breaks
        .replace(/<p[^>]*>(\s*)<\/p>/gi, "\n") // Empty paragraphs to newlines
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<br[^>]*>/gi, "\n")
        // Bold and Italic
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
        // Code blocks
        .replace(
          /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi,
          "```\n$1\n```\n"
        )
        .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
        // Blockquotes
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n")
        // Links
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        // Images
        .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, "![]($1)")
        // Tables
        .replace(/<table[^>]*>(.*?)<\/table>/gi, (match, tableContent) => {
          const rows = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gi) || [];
          return (
            rows
              .map((row: string) => {
                const cells = row.match(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi) || [];
                return cells
                  .map((cell: string) => {
                    return cell.replace(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi, "$1");
                  })
                  .join(" | ");
              })
              .join("\n") + "\n"
          );
        })
        // Clean up
        .replace(/&nbsp;/g, " ")
        .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove extra blank lines
        .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
        // Fix HTML entities
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      // Add proper spacing
      markdown = markdown
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .replace(/\n\n\n+/g, "\n\n");

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        documents.find((doc) => doc.id === activeDocId)?.name || "document"
      }.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !openAIKey) return;

    // Get current document content
    const documentContent = localStorage.getItem(
      `snippet-content${activeDocId ? `-${activeDocId}` : ""}`
    );

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = documentContent || "";
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || "";

    // Check word count
    const wordCount = plainTextContent.trim().split(/\s+/).length;
    if (wordCount > 750) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠⚠️ Your document exceeds the 750 word limit. Please reduce the content to analyze the document.",
        },
      ]);
      return;
    }

    setIsLoading(true);
    const newMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    try {
      // Create system message with document content
      const systemMessage: Message = {
        role: "assistant",
        content: `You are an expert writing assistant focused on helping users refine and enhance their documents. Here is the current content you're working with:
          ${plainTextContent}
          Your role is to:

          Carefully analyze the provided text
          Address the user's specific writing needs and requests
          Provide targeted feedback referencing particular sections
          Suggest concrete improvements while preserving the author's voice
          Consider the document's apparent purpose, tone, and target audience

          When offering suggestions:

          Point to specific sentences or passages using clear indicators (e.g., "In the opening paragraph...")
          Explain the reasoning behind your recommendations
          Provide example revisions when helpful
          Focus on changes that will have the most impact
          Present feedback in a constructive, actionable way

          If the user's intent or goals aren't clear, ask focused questions to better understand how you can help them improve their writing.
          Remember to maintain the document's:

          Core message and purpose
          Author's unique voice and style
          Target audience engagement
          Genre-appropriate conventions
          Overall flow and coherence
          
          Output:
          Provide your feedback in a clear, concise, and actionable manner. Use markdown formatting to highlight specific changes and suggestions.
          If you're unsure about the user's intent or goals, ask clarifying questions to better understand how you can help them improve their writing.
          Always aim to empower writers to make their own informed decisions about their work while providing expert guidance to help them improve.
          
          NOTE:
          Do not give any starting text like "It seems like you've shared a document outlining the features and functionalities of the writing app snippet.today.", just give your feedback like "Here's what you asked for" like this.
          `,
      };

      // Get last 10 messages for context from current document's chat history
      const recentMessages = [...messages.slice(-10), newMessage];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: recentMessages,
          systemMessage,
          apiKey: openAIKey,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Please try again or check your API key.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load documents from localStorage on initial render
    const loadDocuments = () => {
      if (typeof window !== "undefined") {
        const savedDocs = localStorage.getItem("snippet-documents");
        if (savedDocs) {
          const parsedDocs = JSON.parse(savedDocs);
          setDocuments(parsedDocs);

          const lastActiveDoc = localStorage.getItem("snippet-active-doc");
          if (
            lastActiveDoc &&
            parsedDocs.find((doc: Document) => doc.id === lastActiveDoc)
          ) {
            setActiveDocId(lastActiveDoc);
          } else {
            setActiveDocId(parsedDocs[0].id);
          }
        }
      }
    };

    loadDocuments();
  }, []);

  // Update document saving effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("snippet-documents", JSON.stringify(documents));
    }
  }, [documents]);

  // Update active document saving effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("snippet-active-doc", activeDocId);
    }
  }, [activeDocId]);

  // Move the welcome modal check to a useEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowWelcomeModal(!localStorage.getItem("snippet-welcome-shown"));
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("snippet-welcome-shown", "true");
  };

  const handleDragReorder = (draggedId: string, droppedId: string) => {
    const draggedIndex = documents.findIndex((doc) => doc.id === draggedId);
    const droppedIndex = documents.findIndex((doc) => doc.id === droppedId);

    if (draggedIndex === droppedIndex) return;

    const newDocs = [...documents];
    const [draggedDoc] = newDocs.splice(draggedIndex, 1);
    newDocs.splice(droppedIndex, 0, draggedDoc);
    setDocuments(newDocs);
  };

  // Initialize PeerJS when export popup is opened
  useEffect(() => {
    if (showExportPopup && !peer) {
      const newPeer = new Peer();

      newPeer.on("open", () => {
        setPeer(newPeer);
        setConnectionStatus("Ready to share! Waiting for connection...");
      });

      newPeer.on("connection", (conn) => {
        setConnectionStatus("Peer connected! Sending document...");

        conn.on("open", () => {
          // Send the document data
          conn.send({
            id: activeDocId,
            content:
              localStorage.getItem(`snippet-content-${activeDocId}`) || "",
            timestamp: new Date().toISOString(),
          });
          setConnectionStatus("Document sent successfully!");
        });

        conn.on("error", (error) => {
          setConnectionStatus("Error: " + error.message);
        });
      });

      newPeer.on("error", (error) => {
        setConnectionStatus("Error: " + error.message);
      });

      return () => {
        newPeer.destroy();
        setPeer(null);
        setConnectionStatus("");
      };
    }
  }, [showExportPopup, activeDocId]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text", id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text");
    handleDragReorder(draggedId, id);
    setIsDragging(false);
  };

  // Add useEffect for openAIKey initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOpenAIKey(localStorage.getItem("openai-api-key") || "");
    }
  }, []);

  // Add useEffect for messages initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem(`snippet-chat-${activeDocId}`);
      setMessages(savedMessages ? JSON.parse(savedMessages) : []);
    }
  }, [activeDocId]);

  // Add useEffect for welcome modal initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowWelcomeModal(!localStorage.getItem("snippet-welcome-shown"));
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex-none flex justify-between items-center p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">snippet.today</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-yellow-500">⚡</span>
            <span className="text-gray-700">
              snippet /{" "}
              <span className="text-gray-900">
                {documents.find((doc) => doc.id === activeDocId)?.name ||
                  "untitled"}
              </span>
            </span>
          </div>
          <div className="text-gray-400 text-sm flex items-center gap-2">
            <span className={`${wordCount > 0 ? "text-blue-500" : ""}`}>
              {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
            </span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span
              className={`${
                charCount > 0 ? "text-blue-500" : ""
              } hidden sm:inline`}
            >
              {charCount.toLocaleString()}{" "}
              {charCount === 1 ? "character" : "characters"}
            </span>
            <a
              href="https://github.com/sponsors/avayyyyyyy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-medium rounded-md transition-colors duration-200"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"
                />
              </svg>
              <span>Sponsor</span>
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar Toggle Button - Only visible on md and up */}
        <button
          onClick={toggleSidebar}
          className={`
            hidden md:block
            fixed md:absolute 
            left-0 top-20 
            z-20 p-1.5 
            bg-white border border-gray-100 
            rounded-r-md 
            hover:bg-gray-50
            transition-all duration-300
            ${isSidebarCollapsed ? "md:left-0" : "md:left-64"}
          `}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-gray-600 transition-transform duration-200 ${
              isSidebarCollapsed ? "rotate-180" : ""
            }`}
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Sidebar - Only visible on md and up */}
        <aside
          className={`
            hidden md:block
            transition-all duration-300 ease-in-out
            border-r border-gray-100 bg-white
            h-[calc(100vh-8.5rem)]
            overflow-hidden
            ${isSidebarCollapsed ? "w-0 border-r-0" : "w-64"}
          `}
        >
          <div
            className={`
            p-4 flex flex-col gap-4 h-full overflow-y-auto
            ${isSidebarCollapsed ? "opacity-0" : "opacity-100"}
            transition-opacity duration-200
            w-64
          `}
          >
            {/* Document List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-medium text-gray-900">Documents</h2>
                <button
                  onClick={createNewDocument}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  title="Create new document"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
              <div
                className={`space-y-1 ${isDragging ? "document-dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={() => setIsDragging(false)}
              >
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, doc.id)}
                    onDragEnd={() => handleDragEnd()}
                    onDrop={(e) => handleDrop(e, doc.id)}
                    className={`
                      group flex items-center justify-between p-2 rounded-lg
                      ${
                        doc.id === activeDocId
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50 text-gray-700"
                      }
                    `}
                  >
                    <div
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setActiveDocId(doc.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      {isRenaming === doc.id ? (
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onBlur={() => handleRename(doc.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(doc.id);
                            if (e.key === "Escape") setIsRenaming(null);
                          }}
                          className="bg-transparent border-none outline-none text-sm flex-1 min-w-0"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm truncate">{doc.name}</span>
                      )}
                    </div>
                    {!isRenaming && doc.id === activeDocId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(doc.id, doc.name);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Rename"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        {documents.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDocument(doc.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="mt-auto">
              <div className="space-y-2">
                <Link
                  href="/changelog"
                  className="flex flex-col gap-2 p-4 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg group-hover:bg-gray-50 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                        <path d="M10 9H8" />
                      </svg>
                    </div>
                    <span className="font-medium">Latest Updates</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pl-8">
                    Stay up to date with the latest improvements and features
                    added to Snippet Today. We&apos;re constantly working to
                    make your experience better.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`
          flex-1 relative overflow-hidden min-h-0
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "ml-0" : "ml-0"}
        `}
        >
          {/* Editor */}
          <Editor
            onWordCountChange={handleWordCountChange}
            documentId={activeDocId}
          />
        </main>
      </div>

      {/* Footer */}
      <footer className="flex-none border-t border-gray-100 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/shubhcodes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-sm">@shubhcodes</span>
            </a>
          </div>
          <div
            className="flex-1 text-center cursor-pointer hover:text-gray-700 transition-colors group hidden md:block"
            onClick={() => setShowChatPopup(true)}
          >
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></span>
              </span>
              <span className="text-gray-500 group-hover:text-gray-700 transition-colors relative">
                <span className="inline-block animate-float">
                  Start talking with your document
                </span>
                <span className="inline-block mx-1 animate-float-delayed">
                  →
                </span>
                <span className="inline-block animate-float-delayed bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  turn into something magical{" "}
                  <span className="text-black">✨</span>
                </span>
              </span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></span>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/avayyyyyyy/snippet.today"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <span>Star</span>
              {starsCount !== null && (
                <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-xs font-medium">
                  {starsCount}
                </span>
              )}
            </a>
            <button
              onClick={() => setShowExportPopup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              Share
            </button>
          </div>
        </div>
      </footer>

      {/* Export/Share Popup */}
      {showExportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Share & Export</h3>
              <button
                onClick={() => setShowExportPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* QR Code Section */}
              <div className="space-y-2">
                <h4 className="font-medium">Share via QR Code</h4>
                <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center space-y-4">
                  {peer?.id ? (
                    <>
                      <QRCodeSVG
                        value={`${window.location.origin}/receive?peerId=${peer.id}`}
                        size={200}
                      />
                      <div className="w-full max-w-sm break-all text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Or share this URL:
                        </p>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                          <code className="text-xs text-gray-600 flex-1 break-all">
                            {`${window.location.origin}/receive?peerId=${peer.id}`}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/receive?peerId=${peer.id}`
                              );
                              // You could add a toast notification here
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copy URL"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-500"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 w-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                      <p className="text-sm text-gray-600">
                        Generating sharing link...
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR code or use the URL to receive the document in
                  your browser
                </p>
                <div className="text-sm text-gray-600 text-center">
                  {connectionStatus}
                </div>
              </div>

              {/* Export Section */}
              <div className="space-y-2">
                <h4 className="font-medium">Export Options</h4>
                <button
                  onClick={() => {
                    exportAsMarkdown();
                    setShowExportPopup(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export as Markdown
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChatPopup && (
        <ChatPopup
          onClose={() => setShowChatPopup(false)}
          openAIKey={openAIKey}
          setOpenAIKey={setOpenAIKey}
          messages={messages}
          setMessages={setMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isLoading={isLoading}
          sendMessage={sendMessage}
        />
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-3xl bg-white rounded-xl shadow-2xl z-[201] overflow-hidden">
            <div className="relative">
              {/* Video Container */}
              <div
                className="aspect-video w-full bg-gray-900 relative group cursor-pointer"
                onClick={togglePlay}
              >
                {!isVideoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <video
                  ref={videoRef}
                  src="https://utfs.io/f/ZeS8ew97fvPDGFAgwrJkEJXDONL2mBrTcuZ4S3lpjVMzxdHh"
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    isVideoLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  autoPlay
                  muted
                  playsInline
                  onLoadedData={() => setIsVideoLoaded(true)}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  Your browser does not support the video tag.
                </video>
                {/* Custom Play Button - Only show when video is loaded and paused */}
                {isVideoLoaded && !isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-20 h-20 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-black/40">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="transform translate-x-1"
                      >
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    </div>
                  </div>
                )}
                {/* Video Progress Bar - Only show when video is loaded */}
                {isVideoLoaded && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20 z-10">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Content Below Video */}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Welcome to Snippet Today!
                </h2>
                <p className="text-gray-700 mb-4">
                  <span className="font-semibold md:text-sm text-xs">
                    Snippet Today
                  </span>{" "}
                  is a powerful writing assistant that helps you create and
                  organize your ideas. With AI-powered suggestions,
                  distraction-free editing, and automatic saving, you can focus
                  on your writing and let Snippet Today handle the rest.
                </p>
                <div className="flex items-center justify-between mb-6">
                  <div className="items-center gap-2 text-sm hidden md:flex text-gray-500">
                    <span>✨ AI-powered writing assistance</span>
                    <span>•</span>
                    <span>📝 Distraction-free editor</span>
                    <span>•</span>
                    <span>💾 Auto-save</span>
                  </div>
                  <button
                    onClick={() => handleCloseWelcomeModal()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Get Started
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => handleCloseWelcomeModal()}
                className="absolute top-4 right-4 p-1 rounded-full bg-black/50 text-white hover:bg-black/60 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Share Modal */}
      <ShareQRCode
        documentId={activeDocId}
        content={sharedContent}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        @keyframes dropHighlight {
          0% {
            border-color: transparent;
          }
          50% {
            border-color: #3b82f6;
          }
          100% {
            border-color: transparent;
          }
        }

        .document-dragging {
          animation: dropHighlight 1s ease infinite;
        }
      `}</style>
    </div>
  );
}
