"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Peer from "peerjs";

interface DocumentData {
  id: string;
  content: string;
  timestamp: string;
}

function ReceiveComponent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connecting...");
  const [receivedDoc, setReceivedDoc] = useState<DocumentData | null>(null);

  useEffect(() => {
    const peerId = searchParams.get("peerId");
    if (!peerId) {
      setStatus("Error: No peer ID provided");
      return;
    }

    const peer = new Peer();

    peer.on("open", () => {
      setStatus("Connecting to sender...");
      const conn = peer.connect(peerId);

      conn.on("open", () => {
        setStatus("Connected! Waiting for document...");
      });

      conn.on("data", (data) => {
        const docData = data as DocumentData;
        setReceivedDoc(docData);
        setStatus("Document received!");

        if (typeof window !== "undefined") {
          // Save the document to localStorage
          const documents = JSON.parse(
            localStorage.getItem("snippet-documents") || "[]"
          );
          const newDoc = {
            id: Date.now().toString(),
            name: "Received Document",
            content: docData.content,
          };

          // Add the new document to the list
          documents.push(newDoc);
          localStorage.setItem("snippet-documents", JSON.stringify(documents));

          // Save the document content
          localStorage.setItem(`snippet-content-${newDoc.id}`, docData.content);

          // Set this document as the active document
          localStorage.setItem("snippet-active-doc", newDoc.id);

          // Redirect to the editor after a short delay
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        }
      });

      conn.on("error", (error) => {
        setStatus("Error: " + error.message);
      });
    });

    peer.on("error", (error) => {
      setStatus("Error: " + error.message);
    });

    return () => {
      peer.destroy();
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Receiving Document
          </h1>
          <p className="text-gray-600">{status}</p>
        </div>

        {receivedDoc ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-600">
              Redirecting to editor in a moment...
            </p>
          </div>
        ) : (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Back to editor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReceivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <ReceiveComponent />
    </Suspense>
  );
}
