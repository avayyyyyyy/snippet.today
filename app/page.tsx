"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@/app/components/Editor";
import ReactMarkdown from 'react-markdown';

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
                      className={`rounded-lg p-4 text-sm text-gray-700 max-w-[80%] ${
                        message.role === "assistant"
                          ? "bg-gray-50"
                          : "bg-blue-50"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ children }) => (
                              <code className="bg-gray-100 px-1 py-0.5 rounded">{children}</code>
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
    { id: "1", name: "Untitled Document", content: "" },
  ]);
  const [activeDocId, setActiveDocId] = useState("1");
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [openAIKey, setOpenAIKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("openai-api-key") || "";
    }
    return "";
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem("snippet-chat");
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
    return [];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    localStorage.setItem("snippet-chat", JSON.stringify(messages));
  }, [messages]);

  const handleWordCountChange = (words: number, characters: number) => {
    setWordCount(words);
    setCharCount(characters);
  };

  const createNewDocument = () => {
    const newDoc = {
      id: Date.now().toString(),
      name: "Untitled Document",
      content: "",
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newDoc.id);
    localStorage.setItem(`snippet-content-${newDoc.id}`, "");
  };

  const deleteDocument = (id: string) => {
    if (documents.length === 1) return; // Prevent deleting the last document

    // Remove document content from localStorage
    localStorage.removeItem(`snippet-content-${id}`);

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
    const content = localStorage.getItem(`snippet-content-${activeDocId}`);
    if (content) {
      const blob = new Blob([content], { type: "text/markdown" });
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
      activeDocId ? `snippet-content-${activeDocId}` : `snippet-content`
    );

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = documentContent || "";
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || "";

    // Check word count
    const wordCount = plainTextContent.trim().split(/\s+/).length;
    if (wordCount > 750) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Your document exceeds the 750 word limit. Please reduce the content to analyze the document."
      }]);
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
        content: `You are an AI writing assistant. The user is working on a document with the following content:\n\n${plainTextContent}\n\nHelp them improve, analyze, or modify this content based on their requests. Be specific and reference parts of their document when relevant.`,
      };

      // Get last 10 messages for context
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
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorMessage}. Please try again or check your API key.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load documents from localStorage on initial render
    const loadDocuments = () => {
      const savedDocs = localStorage.getItem("snippet-documents");
      if (savedDocs) {
        const parsedDocs = JSON.parse(savedDocs);
        setDocuments(parsedDocs);

        // Set active document
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
    };

    loadDocuments();
  }, []);

  // Add effect to save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("snippet-documents", JSON.stringify(documents));
  }, [documents]);

  // Add effect to save active document ID
  useEffect(() => {
    localStorage.setItem("snippet-active-doc", activeDocId);
  }, [activeDocId]);

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
            <span className="text-gray-300">•</span>
            <span className={`${charCount > 0 ? "text-blue-500" : ""}`}>
              {charCount.toLocaleString()}{" "}
              {charCount === 1 ? "character" : "characters"}
            </span>
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
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-2 rounded-md flex items-center justify-between group ${
                      doc.id === activeDocId
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 flex-1 min-w-0"
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

            {/* Features */}
            <div className="mt-auto">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">Features:</p>
                <li className="text-xs text-gray-500">
                  All your work is saved in the browser.
                </li>
                <li className="text-xs text-gray-500">
                  You can create and save multiple documents.
                </li>
                <li className="text-xs text-gray-500">
                  You can export your document as a markdown file.
                </li>
                <li className="text-xs text-gray-500">
                  You can chat with your document.
                </li>
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

      {/* Export Popup */}
      {showExportPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[150]"
            onClick={() => setShowExportPopup(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-[200] w-[400px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Export Document</h3>
              <button
                onClick={() => setShowExportPopup(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-full transition-colors"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  exportAsMarkdown();
                  setShowExportPopup(false);
                }}
                className="w-full flex items-center justify-between p-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
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
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Markdown</div>
                    <div className="text-gray-500">Export as .md file</div>
                  </div>
                </div>
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
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </>
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
      `}</style>
    </div>
  );
}
