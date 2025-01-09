import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Peer from "peerjs";

interface ShareQRCodeProps {
  documentId: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

const domain = "https://snippet.today";

export default function ShareQRCode({
  documentId,
  content,
  isOpen,
  onClose,
}: ShareQRCodeProps) {
  const [peerId, setPeerId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Initialize PeerJS
      const newPeer = new Peer();

      newPeer.on("open", (id) => {
        setPeerId(id);
        setConnectionStatus("Ready to share! Waiting for connection...");
      });

      newPeer.on("connection", (conn) => {
        setConnectionStatus("Peer connected! Sending document...");
        setIsConnected(true);

        conn.on("open", () => {
          // Send the document data
          conn.send({
            id: documentId,
            content: content,
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

      setPeer(newPeer);

      // Cleanup
      return () => {
        newPeer.destroy();
      };
    }
  }, [isOpen, documentId, content]);

  if (!isOpen) return null;

  const shareUrl = `http://snippet.today/receive?peerId=${peerId}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Document</h3>
          <button
            onClick={onClose}
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

        <div className="flex flex-col items-center space-y-4">
          {peerId ? (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <QRCodeSVG value={shareUrl} size={200} />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Scan this QR code to receive the document in your browser
              </p>
              <div className="text-sm text-gray-600 mt-2">
                {connectionStatus}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
