"use client";

import { useEffect, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Block } from "@blocknote/core";

type Props = {
  initialContent?: unknown;
  onChange: (content: unknown) => void;
};

export default function BlockNoteEditor({ initialContent, onChange }: Props) {
  // Parse initial content: BlockNote expects Block[] or undefined
  const initial = useMemo<Block[] | undefined>(() => {
    if (!initialContent) return undefined;
    if (Array.isArray(initialContent)) return initialContent as Block[];
    // If stored as { blocks: [...] } unwrap it
    const c = initialContent as Record<string, unknown>;
    if (Array.isArray(c.blocks)) return c.blocks as Block[];
    return undefined;
  }, []);

  const editor = useCreateBlockNote({
    initialContent: initial,
  });

  useEffect(() => {
    // Fire initial content so parent has it even before first keystroke
    onChange(editor.document);
  }, []);

  return (
    <div
      style={
        {
          // Override BlockNote's default white background to match our dark shell
          "--bn-colors-editor-background": "var(--cms-bg)",
          "--bn-colors-editor-text": "var(--cms-text)",
          "--bn-colors-menu-background": "var(--cms-surface-2)",
          "--bn-colors-menu-text": "var(--cms-text)",
          "--bn-colors-tooltip-background": "var(--cms-surface-3)",
          "--bn-colors-tooltip-text": "var(--cms-text)",
          "--bn-colors-hovered-background": "var(--cms-surface-3)",
          "--bn-colors-selected-background": "rgba(232,160,48,0.15)",
          "--bn-colors-disabled-background": "var(--cms-surface-2)",
          "--bn-colors-shadow": "rgba(0,0,0,0.5)",
          "--bn-colors-border": "var(--cms-border)",
          "--bn-colors-side-menu": "var(--cms-text-3)",
          "--bn-font-family": "var(--cms-mono)",
          paddingBottom: "120px", // breathing room at bottom of editor
        } as React.CSSProperties
      }
    >
      <BlockNoteView
        editor={editor}
        onChange={() => onChange(editor.document)}
        theme="dark"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
