import { useEffect, useRef, useState } from "react";

interface CommandMenuProps {
  onClose: () => void;
  onCommand: (command: string) => void;
  position: { x: number; y: number };
}

const commandCategories = [
  {
    name: "Basic blocks",
    commands: [
      {
        id: "heading1",
        label: "Heading 1",
        description: "Big section heading",
        icon: "H1",
        category: "Basic blocks",
      },
      {
        id: "heading2",
        label: "Heading 2",
        description: "Medium section heading",
        icon: "H2",
        category: "Basic blocks",
      },
      {
        id: "heading3",
        label: "Heading 3",
        description: "Small section heading",
        icon: "H3",
        category: "Basic blocks",
      },
      {
        id: "bullet-list",
        label: "Bullet List",
        description: "Create a bullet list",
        icon: "•",
        category: "Basic blocks",
      },
      {
        id: "ordered-list",
        label: "Numbered List",
        description: "Create a numbered list",
        icon: "1.",
        category: "Basic blocks",
      },
      {
        id: "blockquote",
        label: "Quote",
        description: "Insert a quote block",
        icon: "❝",
        category: "Basic blocks",
      },
      {
        id: "table",
        label: "Table",
        description: "Insert a table",
        icon: "▦",
        category: "Basic blocks",
      },
      {
        id: "addColumnBefore",
        label: "Add Column Before",
        description: "Add a column before the current one",
        icon: "◀│",
        category: "Basic blocks",
      },
      {
        id: "addColumnAfter",
        label: "Add Column After",
        description: "Add a column after the current one",
        icon: "│▶",
        category: "Basic blocks",
      },
      {
        id: "addRowBefore",
        label: "Add Row Before",
        description: "Add a row before the current one",
        icon: "▲",
        category: "Basic blocks",
      },
      {
        id: "addRowAfter",
        label: "Add Row After",
        description: "Add a row after the current one",
        icon: "▼",
        category: "Basic blocks",
      },
      {
        id: "deleteColumn",
        label: "Delete Column",
        description: "Delete the current column",
        icon: "│✕",
        category: "Basic blocks",
      },
      {
        id: "deleteRow",
        label: "Delete Row",
        description: "Delete the current row",
        icon: "─✕",
        category: "Basic blocks",
      },
    ],
  },
  {
    name: "Formatting",
    commands: [
      {
        id: "bold",
        label: "Bold",
        description: "Make text bold",
        icon: "𝐁",
        category: "Formatting",
        shortcut: "⌘+B",
      },
      {
        id: "italic",
        label: "Italic",
        description: "Make text italic",
        icon: "𝑰",
        category: "Formatting",
        shortcut: "⌘+I",
      },
      {
        id: "underline",
        label: "Underline",
        description: "Underline text",
        icon: "U̲",
        category: "Formatting",
        shortcut: "⌘+U",
      },
      {
        id: "code-block",
        label: "Code",
        description: "Insert a code block",
        icon: "</>",
        category: "Formatting",
      },
      {
        id: "horizontal-rule",
        label: "Divider",
        description: "Insert a dividing line",
        icon: "—",
        category: "Formatting",
      },
    ],
  },
  {
    name: "Actions",
    commands: [
      {
        id: "clear",
        label: "Clear",
        description: "Clear all content",
        icon: "🗑️",
        category: "Actions",
      },
      {
        id: "export",
        label: "Export",
        description: "Save as HTML file",
        icon: "📥",
        category: "Actions",
      },
      {
        id: "undo",
        label: "Undo",
        description: "Undo last change",
        icon: "↩️",
        category: "Actions",
        shortcut: "⌘+Z",
      },
      {
        id: "redo",
        label: "Redo",
        description: "Redo last change",
        icon: "↪️",
        category: "Actions",
        shortcut: "⌘+⇧+Z",
      },
    ],
  },
];

export default function CommandMenu({
  onClose,
  onCommand,
  position,
}: CommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const allCommands = commandCategories.flatMap(
    (category) => category.commands
  );
  const filteredCommands = allCommands.filter(
    (command) =>
      command.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      command.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          onCommand(selectedCommand.id);
        }
      } else if (event.key === " " && searchTerm === "") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, onCommand, filteredCommands, selectedIndex, searchTerm]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        left: `${Math.min(
          Math.max(position.x, 140),
          window.innerWidth - 140
        )}px`,
        top: `${position.y}px`,
        transform: "translateX(-50%)",
        maxHeight: "300px",
        overflowY: "auto",
        width: "280px",
      }}
      className="bg-white rounded-lg shadow-lg p-2 z-[100] border border-gray-200"
    >
      <div className="relative">
        <input
          type="text"
          placeholder="Type a command..."
          className="w-full px-2 py-1.5 bg-gray-50 border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedIndex(0);
          }}
          autoFocus
        />
      </div>

      <div className="overflow-y-auto">
        {(searchTerm
          ? [{ name: "Search results", commands: filteredCommands }]
          : commandCategories
        ).map(
          (category) =>
            category.commands.length > 0 && (
              <div key={category.name} className="mb-2 last:mb-0">
                <h3 className="text-[10px] mt-3 font-semibold text-gray-500 uppercase px-2 mb-1">
                  {category.name}
                </h3>
                <div className="space-y-0.5">
                  {category.commands.map((command) => {
                    const commandIndex = filteredCommands.indexOf(command);
                    return (
                      <div
                        key={command.id}
                        ref={
                          commandIndex === selectedIndex
                            ? selectedItemRef
                            : null
                        }
                        className={`
                          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm
                          ${
                            commandIndex === selectedIndex
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }
                        `}
                        onClick={() => onCommand(command.id)}
                      >
                        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-base">
                          {command.icon}
                        </span>
                        <span className="flex-1 truncate">{command.label}</span>
                        {command.shortcut && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {command.shortcut}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
