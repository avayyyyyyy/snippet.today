import { useCallback, useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CommandMenu from "./CommandMenu";
import { initialBody } from "@/initialBody";

interface EditorProps {
  onWordCountChange: (words: number, characters: number) => void;
  documentId?: string;
}

const STORAGE_PREFIX = "snippet-content-";

// Custom image extension with resizing
const ResizableImage = Image.extend({
  name: "resizable-image",
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
    };
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement("div");
      container.className = "image-resizer";
      container.style.width = "fit-content";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.className = "resize-image";
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`;
      if (node.attrs.height) img.style.height = `${node.attrs.height}px`;

      const resizeHandle = document.createElement("div");
      resizeHandle.className = "resize-handle";

      let startX: number;
      let startWidth: number;
      let startHeight: number;

      const onMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        startX = event.pageX;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };

      const onMouseMove = (event: MouseEvent) => {
        const dx = event.pageX - startX;
        const width = startWidth + dx;
        const height = Math.round(width * (startHeight / startWidth));

        img.style.width = `${width}px`;
        img.style.height = `${height}px`;

        if (typeof getPos === "function") {
          editor
            .chain()
            .updateAttributes("resizable-image", {
              width,
              height,
            })
            .run();
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      resizeHandle.addEventListener("mousedown", onMouseDown);

      container.appendChild(img);
      container.appendChild(resizeHandle);

      return {
        dom: container,
        destroy: () => {
          resizeHandle.removeEventListener("mousedown", onMouseDown);
        },
      };
    };
  },
});

export default function Editor({
  onWordCountChange,
  documentId = "1",
}: EditorProps) {
  const [showCommands, setShowCommands] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const countWordsAndChars = useCallback(
    (text: string) => {
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const characters = text.length;
      onWordCountChange(words, characters);
    },
    [onWordCountChange]
  );

  const handlePaste = (view: unknown, event: ClipboardEvent) => {
    if (!event.clipboardData || !editor) return false;

    const text = event.clipboardData.getData("text/plain");
    const items = Array.from(event.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith("image"));

    // Handle image paste - directly embed without popup
    if (imageItems.length > 0) {
      event.preventDefault();
      const file = imageItems[0].getAsFile();
      if (!file) return false;

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = document.createElement("img");
        img.src = url;
        img.onload = () => {
          const maxWidth = 320;
          const width = Math.min(img.width, maxWidth);
          const height = Math.round(width * (img.height / img.width));

          editor
            ?.chain()
            .focus()
            .insertContent({
              type: "resizable-image",
              attrs: {
                src: url,
                width,
                height,
              },
            })
            .run();
        };
      };
      reader.readAsDataURL(file);
      return true;
    }

    // Handle link paste - insert as plain link
    const urlMatch = text.match(/^https?:\/\/[^\s]+$/);
    if (urlMatch) {
      event.preventDefault();
      editor
        ?.chain()
        .focus()
        .insertContent(
          `<a href="${text}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${text}</a>`
        )
        .run();
      return true;
    }

    return false;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 10,
          newGroupDelay: 300,
        },
      }),
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "resize-image",
        },
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        autolink: true,
        protocols: ["http", "https"],
        HTMLAttributes: {
          class: "text-blue-600 hover:underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "paragraph") {
            return 'Press Cmd/Ctrl + "/" for commands...';
          }
          return "";
        },
        showOnlyWhenEditable: true,
      }),
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-t border-gray-200",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-200 p-2",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-200 p-2 bg-gray-50 font-medium",
        },
      }),
    ],
    content: initialBody,
    editable: true,
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
      handlePaste,
      handleDrop: (view, event) => {
        if (!event.dataTransfer) return false;

        const hasFiles = event.dataTransfer.files.length > 0;
        const hasImages = Array.from(event.dataTransfer.files).some((file) =>
          file.type.startsWith("image")
        );

        if (!hasFiles || !hasImages) return false;

        event.preventDefault();

        Array.from(event.dataTransfer.files)
          .filter((file) => file.type.startsWith("image"))
          .forEach((file) => {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const url = readerEvent.target?.result;
              if (typeof url !== "string") return;

              const img = document.createElement("img");
              img.src = url;
              img.onload = () => {
                const maxWidth = 320;
                const width = Math.min(img.width, maxWidth);
                const height = Math.round(width * (img.height / img.width));

                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: "resizable-image",
                    attrs: {
                      src: url,
                      width,
                      height,
                    },
                  })
                  .run();
              };
            };
            reader.readAsDataURL(file);
          });

        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      if (content !== "<p></p>") {
        countWordsAndChars(editor.getText());
        localStorage.setItem(`${STORAGE_PREFIX}${documentId}`, content);
      }
    },
  });

  useEffect(() => {
    if (editor && documentId) {
      const savedContent = localStorage.getItem(
        `${STORAGE_PREFIX}${documentId}`
      );
      if (savedContent && savedContent !== "<p></p>") {
        editor.commands.setContent(savedContent);
        // Count words and characters after setting content
        const text = editor.getText();
        countWordsAndChars(text);
      } else {
        editor.commands.setContent(initialBody);
        // Count words and characters for the welcome content
        const text = editor.getText();
        countWordsAndChars(text);
      }
    }
  }, [documentId, editor]);

  useEffect(() => {
    // Add click handler for images
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const resizeContainer = target.closest(".image-resizer");
      if (target.tagName === "IMG" && resizeContainer) {
        e.preventDefault();
        e.stopPropagation();
        setPreviewImage(target.getAttribute("src"));
      }
    };

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener("click", handleImageClick);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener("click", handleImageClick);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/" && (e.metaKey || e.ctrlKey) && editor?.view) {
      e.preventDefault();
      const { view } = editor;
      const { top, left } = view.coordsAtPos(view.state.selection.from);
      const editorBounds = editorRef.current?.getBoundingClientRect() || {
        top: 0,
        left: 0,
      };
      const viewportHeight = window.innerHeight;

      // Calculate position
      let y = top - editorBounds.top + 24;
      const x = left - editorBounds.left;

      // Check if menu would go off-screen
      const menuHeight = 300; // Approximate height of command menu
      if (y + menuHeight > viewportHeight) {
        y = y - menuHeight - 24; // Position above cursor if it would go off-screen
      }

      setMenuPosition({ x, y });
      setShowCommands(!showCommands);
      return;
    }

    // Table shortcuts
    if (editor?.isActive("table")) {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().goToPreviousCell().run();
        } else {
          e.preventDefault();
          editor.chain().focus().goToNextCell().run();
        }
      }

      // Add row/column shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "ArrowRight" && e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().addColumnAfter().run();
        } else if (e.key === "ArrowLeft" && e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().addColumnBefore().run();
        } else if (e.key === "ArrowDown" && e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().addRowAfter().run();
        } else if (e.key === "ArrowUp" && e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().addRowBefore().run();
        }
      }

      // Delete row/column shortcuts
      if ((e.metaKey || e.ctrlKey) && e.altKey) {
        if (e.key === "Backspace") {
          e.preventDefault();
          editor.chain().focus().deleteTable().run();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          editor.chain().focus().deleteRow().run();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          editor.chain().focus().deleteColumn().run();
        }
      }
    }

    // Allow normal '/' typing
    if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
      return;
    }
  };

  const handleCommand = (command: string) => {
    if (!editor) return;

    switch (command) {
      case "clear":
        editor.commands.clearContent();
        countWordsAndChars("");
        localStorage.removeItem(`${STORAGE_PREFIX}${documentId}`);
        break;
      case "export":
        const content = editor.getHTML();
        const blob = new Blob([content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.html";
        a.click();
        break;
      case "heading1":
        editor.commands.toggleHeading({ level: 1 });
        break;
      case "heading2":
        editor.commands.toggleHeading({ level: 2 });
        break;
      case "heading3":
        editor.commands.toggleHeading({ level: 3 });
        break;
      case "bold":
        editor.commands.toggleBold();
        break;
      case "italic":
        editor.commands.toggleItalic();
        break;
      case "bullet-list":
        editor.commands.toggleBulletList();
        break;
      case "ordered-list":
        editor.commands.toggleOrderedList();
        break;
      case "code-block":
        editor.commands.toggleCodeBlock();
        break;
      case "blockquote":
        editor.commands.toggleBlockquote();
        break;
      case "horizontal-rule":
        editor.commands.setHorizontalRule();
        break;
      case "undo":
        editor.commands.undo();
        break;
      case "redo":
        editor.commands.redo();
        break;
      case "underline":
        editor.commands.toggleUnderline();
        break;
      case "table":
        editor
          .chain()
          .focus()
          .insertContent({
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableHeader",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Header 1" }],
                      },
                    ],
                  },
                  {
                    type: "tableHeader",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Header 2" }],
                      },
                    ],
                  },
                  {
                    type: "tableHeader",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Header 3" }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                ],
              },
              {
                type: "tableRow",
                content: [
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                ],
              },
            ],
          })
          .run();
        break;
      case "addColumnBefore":
        editor.chain().focus().addColumnBefore().run();
        break;
      case "addColumnAfter":
        editor.chain().focus().addColumnAfter().run();
        break;
      case "addRowBefore":
        editor.chain().focus().addRowBefore().run();
        break;
      case "addRowAfter":
        editor.chain().focus().addRowAfter().run();
        break;
      case "deleteColumn":
        editor.chain().focus().deleteColumn().run();
        break;
      case "deleteRow":
        editor.chain().focus().deleteRow().run();
        break;
    }
    setShowCommands(false);
    setTimeout(() => {
      editor.commands.focus();
    }, 0);
  };

  return (
    <div
      className="relative flex-1 overflow-hidden h-full"
      onKeyDown={handleKeyDown}
      ref={editorRef}
    >
      <style jsx global>{`
        .ProseMirror {
          height: 100%;
          padding: 2rem;
          overflow-y: auto;
          > * + * {
            margin-top: 0.5em;
          }
        }

        .ProseMirror p.is-empty::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          width: 100%;
          font-style: normal;
          opacity: 0.75;
        }

        .image-resizer {
          display: inline-block;
          position: relative;
          margin: 0.75rem 0;
          max-width: 100%;
          width: fit-content;
          cursor: zoom-in;
        }

        .resize-image {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 0;
          transition: transform 0.2s ease;
        }

        .image-resizer:hover .resize-image {
          transform: scale(1.02);
        }

        .resize-handle {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          background-color: rgb(59, 130, 246);
          border: 1.5px solid #fff;
          position: absolute;
          right: -4px;
          bottom: -4px;
          cursor: se-resize;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .image-resizer:hover .resize-handle {
          opacity: 1;
        }

        @keyframes scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-up {
          animation: scale-up 0.2s ease-out forwards;
        }

        .link-preview {
          text-decoration: none !important;
          color: inherit;
        }

        .link-preview a {
          text-decoration: none !important;
          color: inherit;
        }

        .link-preview img {
          margin: 0;
        }

        .link-preview .aspect-video {
          position: relative;
          padding-top: 56.25%;
        }

        .link-preview .aspect-video img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .link-preview {
          max-width: 100%;
          margin: 1.5rem 0;
        }

        .link-preview img {
          margin: 0;
          display: block;
        }

        .link-preview a {
          text-decoration: none !important;
          color: inherit !important;
        }

        .resize-image {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem 1rem;
        }

        .image-resizer {
          display: block;
          position: relative;
          margin: 1.5rem;
        }

        .resize-handle {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          background-color: rgb(59, 130, 246);
          border: 1.5px solid #fff;
          position: absolute;
          right: -5px;
          bottom: -5px;
          cursor: se-resize;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .image-resizer:hover .resize-handle {
          opacity: 1;
        }

        .link-preview {
          max-width: 100%;
          margin: 0.75rem 0;
        }

        .link-preview img {
          margin: 0;
          display: block;
        }

        .link-preview a {
          text-decoration: none !important;
          color: inherit !important;
        }

        .resize-image {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0.75rem 0;
        }

        .image-resizer {
          display: block;
          position: relative;
          margin: 0.75rem 0;
          max-width: 100%;
        }

        .resize-handle {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          background-color: rgb(59, 130, 246);
          border: 1.5px solid #fff;
          position: absolute;
          right: -4px;
          bottom: -4px;
          cursor: se-resize;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .image-resizer:hover .resize-handle {
          opacity: 1;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 0;
        }

        .link-preview {
          max-width: 100%;
          margin: 0.75rem 0;
        }

        .link-preview .rtl-card-container {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .link-preview .rtl-card-container:hover {
          border-color: #d1d5db;
        }

        .link-preview .rtl-card-media {
          height: 120px !important;
        }

        .link-preview .rtl-card-content {
          padding: 0.75rem !important;
        }

        .link-preview .rtl-card-description {
          font-size: 0.875rem !important;
          color: #4b5563 !important;
        }

        .link-preview .rtl-card-title {
          font-size: 1rem !important;
          color: #111827 !important;
          font-weight: 500 !important;
        }

        .ProseMirror table {
          border-collapse: collapse;
          margin: 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }

        .ProseMirror td,
        .ProseMirror th {
          border: 2px solid #ced4da;
          box-sizing: border-box;
          min-width: 1em;
          padding: 3px 5px;
          position: relative;
          vertical-align: top;
        }

        .ProseMirror th {
          background-color: #f8f9fa;
          font-weight: bold;
          text-align: left;
        }

        .ProseMirror .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .ProseMirror .column-resize-handle {
          background-color: #adf;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }

        .ProseMirror p {
          margin: 0;
        }
      `}</style>
      <EditorContent editor={editor} className="w-full h-full" />

      {showCommands && (
        <CommandMenu
          onClose={() => setShowCommands(false)}
          onCommand={handleCommand}
          position={menuPosition}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] transition-opacity duration-300"
            onClick={() => setPreviewImage(null)}
          />
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <div className="relative max-w-[90vw] max-h-[90vh] animate-scale-up">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
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
    </div>
  );
}
