"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { forwardRef, useImperativeHandle } from "react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Highlighter,
  Undo2,
  Redo2,
} from "lucide-react";
import { clsx } from "clsx";

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export interface TiptapEditorRef {
  /** 获取 TipTap 编辑器实例，用于外部插入内容等操作 */
  getEditor: () => Editor | null;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(function TiptapEditor({ content, onChange }, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-accent underline underline-offset-2",
        },
      }),
      Placeholder.configure({
        placeholder: "开始书写你的内容...",
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Typography,
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto max-h-[400px] object-contain mx-auto my-4",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[400px] p-6 focus:outline-none [&_pre]:!bg-[#1e1e2e] [&_pre]:!rounded-lg [&_pre]:!p-4",
      },
    },
    immediatelyRender: false,
  });

  // 暴露编辑器实例给父组件
  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }), [editor]);

  if (!editor) return null;

  const e = editor;

  function addLink() {
    const previousUrl = e.getAttributes("link").href;
    const url = window.prompt("输入链接 URL:", previousUrl || "https://");

    if (url === null) return;
    if (url === "") {
      e.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const safeScheme = /^(https?:|mailto:|tel:)/i;
    if (!safeScheme.test(url.trim())) {
      window.alert("仅支持 http://、https://、mailto: 和 tel: 链接");
      return;
    }

    e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const tools = [
    {
      icon: Bold,
      action: () => e.chain().focus().toggleBold().run(),
      active: e.isActive("bold"),
      tip: "粗体",
    },
    {
      icon: Italic,
      action: () => e.chain().focus().toggleItalic().run(),
      active: e.isActive("italic"),
      tip: "斜体",
    },
    {
      icon: UnderlineIcon,
      action: () => e.chain().focus().toggleUnderline().run(),
      active: e.isActive("underline"),
      tip: "下划线",
    },
    {
      icon: Strikethrough,
      action: () => e.chain().focus().toggleStrike().run(),
      active: e.isActive("strike"),
      tip: "删除线",
    },
    {
      icon: Highlighter,
      action: () => e.chain().focus().toggleHighlight().run(),
      active: e.isActive("highlight"),
      tip: "高亮",
    },
    { type: "divider" },
    {
      icon: Heading1,
      action: () => e.chain().focus().toggleHeading({ level: 1 }).run(),
      active: e.isActive("heading", { level: 1 }),
      tip: "标题1",
    },
    {
      icon: Heading2,
      action: () => e.chain().focus().toggleHeading({ level: 2 }).run(),
      active: e.isActive("heading", { level: 2 }),
      tip: "标题2",
    },
    {
      icon: Heading3,
      action: () => e.chain().focus().toggleHeading({ level: 3 }).run(),
      active: e.isActive("heading", { level: 3 }),
      tip: "标题3",
    },
    { type: "divider" },
    {
      icon: List,
      action: () => e.chain().focus().toggleBulletList().run(),
      active: e.isActive("bulletList"),
      tip: "无序列表",
    },
    {
      icon: ListOrdered,
      action: () => e.chain().focus().toggleOrderedList().run(),
      active: e.isActive("orderedList"),
      tip: "有序列表",
    },
    {
      icon: Quote,
      action: () => e.chain().focus().toggleBlockquote().run(),
      active: e.isActive("blockquote"),
      tip: "引用",
    },
    {
      icon: Code,
      action: () => e.chain().focus().toggleCodeBlock().run(),
      active: e.isActive("codeBlock"),
      tip: "代码块",
    },
    {
      icon: Minus,
      action: () => e.chain().focus().setHorizontalRule().run(),
      active: false,
      tip: "分割线",
    },
    { type: "divider" },
    {
      icon: LinkIcon,
      action: addLink,
      active: e.isActive("link"),
      tip: "链接",
    },
    { type: "divider" },
    {
      icon: Undo2,
      action: () => e.chain().focus().undo().run(),
      active: false,
      tip: "撤销",
    },
    {
      icon: Redo2,
      action: () => e.chain().focus().redo().run(),
      active: false,
      tip: "重做",
    },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-800 bg-[#151525]">
        {tools.map((tool, i) => {
          if ("type" in tool && tool.type === "divider") {
            return (
              <div
                key={`divider-${i}`}
                className="w-px h-5 bg-gray-700 mx-1"
              />
            );
          }

          const { icon: Icon, action, active, tip } = tool as {
            icon: any;
            action: () => void;
            active: boolean;
            tip: string;
          };

          return (
            <button
              key={tip}
              onClick={action}
              title={tip}
              className={clsx(
                "p-1.5 rounded transition-colors",
                active
                  ? "bg-accent/20 text-accent"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
});
