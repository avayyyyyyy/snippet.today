import { useCallback, useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CommandMenu from "./CommandMenu";

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
    ],
    content: "<p></p>",
    editable: true,
    autofocus: "end",
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
        editor.commands.setContent(`
          <h1>Welcome to snippet.today! ✨</h1>
          <p>Your minimalist, privacy-focused writing companion that works entirely in your browser.</p>

          <h2>🎯 Core Features</h2>
          <ul>
            <li><strong>Command Menu</strong> - Press <code>Cmd/Ctrl + /</code> to access formatting options and commands</li>
            <li><strong>Multiple Documents</strong> - Create, rename, and manage multiple documents from the sidebar</li>
            <li><strong>Auto-Save</strong> - Your work is automatically saved in your browser</li>
            <li><strong>Word Counter</strong> - Real-time word and character count</li>
          </ul>

          <h2>✍️ Writing Tools</h2>
          <ul>
            <li><strong>Rich Text Editor</strong> - Format text with headings, lists, quotes, and more</li>
            <li><strong>Markdown Support</strong> - Use markdown shortcuts or the command menu</li>
            <li><strong>Distraction-Free</strong> - Clean, minimal interface focused on writing</li>
            <li><strong>Export Options</strong> - Save your work as markdown files</li>
          </ul>

          <h2>🤖 AI Assistant</h2>
          <ul>
            <li><strong>Writing Help</strong> - Get suggestions to improve your writing</li>
            <li><strong>Grammar Check</strong> - Fix grammar and style issues</li>
            <li><strong>Content Ideas</strong> - Generate ideas and overcome writer's block</li>
            <li><strong>Document Analysis</strong> - Get insights about your writing</li>
          </ul>

          <h2>📸 Image Support</h2>
          <ul>
            <li><strong>Drag & Drop</strong> - Simply drag images into the editor</li>
            <li><strong>Copy & Paste</strong> - Paste images directly from your clipboard</li>
            <li><strong>Resize Controls</strong> - Easily adjust image size with the blue handle</li>
            <li><strong>Inline Display</strong> - Images flow naturally with your text</li>
          </ul>

          <h2>🔒 Privacy First</h2>
          <ul>
            <li><strong>Local Storage</strong> - All data stays in your browser</li>
            <li><strong>No Account Needed</strong> - Start writing immediately</li>
            <li><strong>Your API Key</strong> - Use your own OpenAI key for AI features</li>
            <li><strong>No Tracking</strong> - We don't track your writing or usage</li>
          </ul>

          <h2>🚀 Quick Start</h2>
          <ol>
            <li>Clear this welcome message using the command menu (<code>Cmd/Ctrl + /</code>)</li>
            <li>Create a new document using the + button in the sidebar</li>
            <li>Start writing or paste your existing content</li>
            <li>Use the AI assistant by clicking the chat button in the footer</li>
          </ol>

          <blockquote>
            <p><strong>Pro Tip:</strong> Collapse the sidebar for a more focused writing experience. All your documents are automatically saved as you type.</p>
          </blockquote>

          <p>Start writing now! Use the command menu or sidebar to clear this welcome message. Happy writing! ✍️</p>
        `);
        // Count words and characters for the welcome content
        const text = editor.getText();
        countWordsAndChars(text);
      }
    }
  }, [documentId, editor, countWordsAndChars]);

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
    }
    setShowCommands(false);
    // Focus the editor after command execution
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
        }

        .resize-image {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 0;
        }

        .resize-handle {
          width: 8px;
          height: 8px;
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
      `}</style>
      <EditorContent editor={editor} className="w-full h-full" />

      {showCommands && (
        <CommandMenu
          onClose={() => setShowCommands(false)}
          onCommand={handleCommand}
          position={menuPosition}
        />
      )}
    </div>
  );
}
