"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Peer from "peerjs";

interface DocumentData {
  id: string;
  content: string;
  timestamp: string;
}

export default function ReceivePage() {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-4">Receive Document</h1>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">{status}</p>
          </div>

          {receivedDoc && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">
                ✓ Document received successfully!
              </p>
              <p className="text-sm text-gray-600">
                The document has been saved to your documents list.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open in Editor
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
