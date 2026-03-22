function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type BlockNode = {
  type?: string;
  text?: string;
  level?: number;
  url?: string;
  alt?: string;
  title?: string;
  items?: unknown[];
  attrs?: Record<string, unknown>;
  content?: unknown[];
  marks?: Array<{ type: string }>;
  [key: string]: unknown;
};

function renderInline(node: BlockNode): string {
  if (!node || typeof node !== "object") return "";

  if (node.type === "text") {
    let text = escapeHtml(node.text ?? "");

    if (Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
          case "strong":
            text = `<strong>${text}</strong>`;
            break;
          case "italic":
          case "em":
            text = `<em>${text}</em>`;
            break;
          case "underline":
            text = `<u>${text}</u>`;
            break;
          case "strike":
          case "strikethrough":
            text = `<s>${text}</s>`;
            break;
          case "code":
            text = `<code>${text}</code>`;
            break;
          default:
            break;
        }
      }
    }

    return text;
  }

  if (node.type === "hard_break") return "<br/>";
  if (node.type === "link") {
    const href = escapeHtml(String(node.url || ""));
    const inner = Array.isArray(node.content)
      ? node.content.map((child) => renderInline(child as BlockNode)).join("")
      : "";
    return `<a href=\"${href}\">${inner}</a>`;
  }

  return "";
}

function getBlockContent(block: BlockNode): string {
  const inlineNodes: BlockNode[] = [];

  if (Array.isArray(block.content)) {
    inlineNodes.push(...(block.content as BlockNode[]));
  }

  if (Array.isArray(block.children)) {
    inlineNodes.push(...(block.children as BlockNode[]));
  }

  return inlineNodes.map((child) => {
    if (child && typeof child === "object") return renderInline(child);
    return "";
  }).join("");
}

function renderBlock(block: BlockNode): string {
  if (!block || typeof block !== "object") return "";

  const childrenContent = getBlockContent(block);

  switch (block.type) {
    case "paragraph":
      return `<p>${childrenContent}</p>`;

    case "heading": {
      const level = Math.min(
        Math.max(
          Number(block.level || (block.props as any)?.level || 1) || 1,
          1,
        ),
        6,
      );
      return `<h${level}>${childrenContent}</h${level}>`;
    }

    case "blockquote":
      return `<blockquote>${childrenContent}</blockquote>`;

    case "code_block":
    case "code":
      return `<pre><code>${escapeHtml(String(block.text ?? childrenContent))}</code></pre>`;

    case "bullet_list": {
      const items = Array.isArray(block.content)
        ? block.content.map((item) => renderBlock(item as BlockNode)).join("")
        : "";
      return `<ul>${items}</ul>`;
    }

    case "ordered_list": {
      const items = Array.isArray(block.content)
        ? block.content.map((item) => renderBlock(item as BlockNode)).join("")
        : "";
      return `<ol>${items}</ol>`;
    }

    case "list_item":
      return `<li>${childrenContent}</li>`;

    case "image": {
      const props = (block.props as Record<string, unknown>) ?? {};
      const src = escapeHtml(
        String(
          block.url || props.url || block.attrs?.src || "",
        ),
      );
      const alt = escapeHtml(
        String(
          block.alt || props.alt || props.caption || block.attrs?.alt || "",
        ),
      );
      const title = escapeHtml(
        String(block.title || props.title || block.attrs?.title || ""),
      );
      const titleAttr = title ? ` title=\"${title}\"` : "";
      return `<img src=\"${src}\" alt=\"${alt}\"${titleAttr}/>`;
    }

    default:
      if (Array.isArray(block.content) || Array.isArray(block.children)) {
        return getBlockContent(block);
      }

      // Fallback to string content fields
      if (typeof block.text === "string") {
        return `<p>${escapeHtml(block.text)}</p>`;
      }

      return "";
  }
}

function convertContentNode(value: unknown): unknown {
  if (value == null) return value;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const html = value.map((block) => renderBlock(block as BlockNode)).join("");

    return html;
  }

  if (typeof value === "object") {
    const node = value as Record<string, unknown>;

    if (Array.isArray(node.blocks)) {
      return convertContentNode(node.blocks);
    }

    const mapped: Record<string, unknown> = {};
    for (const key of Object.keys(node)) {
      mapped[key] = convertContentNode(node[key]);
    }

    return mapped;
  }

  return "";
}

export function contentToHtml(content: unknown): unknown {
  return convertContentNode(content);
}
