import { useEffect, useRef, useState } from 'react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';

import {
  Bot,
  GripHorizontal,
  GripVertical,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import aiService from '../../services/ai.service';
import type { ChatMessage } from '../../types/ai';

type ResizeDirection = 'left' | 'top' | 'corner' | null;

const MIN_WIDTH = 360;
const MIN_HEIGHT = 400;

function getMaxWidth() {
  return Math.max(MIN_WIDTH, window.innerWidth * 0.95);
}

function getMaxHeight() {
  return Math.max(MIN_HEIGHT, window.innerHeight * 0.95);
}

function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  /*
   * Default size of the assistant.
   *
   * The user can resize this later using:
   * - left edge
   * - top edge
   * - top-left corner
   */
  const [panelWidth, setPanelWidth] = useState(430);
  const [panelHeight, setPanelHeight] = useState(
    Math.min(720, Math.max(400, window.innerHeight * 0.8)),
  );

  const [isResizing, setIsResizing] = useState<ResizeDirection>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! 👋 I’m your School AI Assistant. How can I help you today?',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /*
   * Stores the starting mouse/pointer position and panel size
   * while resizing.
   */
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    width: 430,
    height: 600,
  });

  /*
   * Automatically scroll to the latest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  /*
   * Listen for the custom event used elsewhere in the application
   * to open the AI assistant.
   */
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-ai-assistant', handleOpenAssistant);

    return () => {
      window.removeEventListener('open-ai-assistant', handleOpenAssistant);
    };
  }, []);

  /*
   * Keep the panel inside the browser when the browser window
   * is resized.
   */
  useEffect(() => {
    const handleWindowResize = () => {
      setPanelWidth((currentWidth) => Math.min(currentWidth, getMaxWidth()));

      setPanelHeight((currentHeight) =>
        Math.min(currentHeight, getMaxHeight()),
      );
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  /*
   * Resize panel.
   *
   * Because the panel is fixed to the bottom-right:
   *
   * left edge:
   *   moving left  = wider
   *   moving right = narrower
   *
   * top edge:
   *   moving up   = taller
   *   moving down = shorter
   */
  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = resizeStartRef.current;

      const deltaX = start.x - event.clientX;
      const deltaY = start.y - event.clientY;

      if (isResizing === 'left' || isResizing === 'corner') {
        const newWidth = Math.min(
          Math.max(MIN_WIDTH, start.width + deltaX),
          getMaxWidth(),
        );

        setPanelWidth(newWidth);
      }

      if (isResizing === 'top' || isResizing === 'corner') {
        const newHeight = Math.min(
          Math.max(MIN_HEIGHT, start.height + deltaY),
          getMaxHeight(),
        );

        setPanelHeight(newHeight);
      }
    };

    const handlePointerUp = () => {
      setIsResizing(null);
    };

    window.addEventListener('pointermove', handlePointerMove);

    window.addEventListener('pointerup', handlePointerUp);

    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);

      window.removeEventListener('pointerup', handlePointerUp);

      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  /*
   * Start resizing.
   */
  const startResize = (
    direction: ResizeDirection,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: panelWidth,
      height: panelHeight,
    };

    setIsResizing(direction);
  };

  /*
   * Send message to AI.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: message,
    };

    setMessages((previous) => [...previous, userMessage]);

    setInput('');
    setLoading(true);

    try {
      const reply = await aiService.chat(message);

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: reply,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);

      const errorMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content:
          'Sorry, I could not process your request right now. Please try again.',
      };

      setMessages((previous) => [...previous, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* =========================================================
          Floating AI Assistant Button
      ========================================================== */}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="
            fixed bottom-6 right-6 z-[60]
            flex items-center gap-2.5
            rounded-full
            bg-gradient-to-r from-blue-600 to-indigo-600
            px-4 py-3
            text-white
            shadow-xl shadow-blue-500/25
            transition-all duration-300
            hover:-translate-y-1
            hover:shadow-2xl hover:shadow-blue-500/30
            focus:outline-none
            focus:ring-4 focus:ring-blue-200
          "
          aria-label="Open AI Assistant"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <Sparkles size={18} />

            <span
              className="
                absolute -right-0.5 -top-0.5
                h-2.5 w-2.5
                rounded-full
                border-2 border-blue-600
                bg-emerald-400
              "
            />
          </span>

          <span className="text-sm font-semibold">AI Assistant</span>
        </button>
      )}

      {/* =========================================================
          Mobile Backdrop
      ========================================================== */}

      {isOpen && (
        <button
          type="button"
          aria-label="Close AI Assistant"
          onClick={() => setIsOpen(false)}
          className="
            fixed inset-0 z-[50]
            bg-slate-950/30
            backdrop-blur-[2px]
            md:hidden
          "
        />
      )}

      {/* =========================================================
          Chat Panel
      ========================================================== */}

      <div
        className={`
          fixed bottom-0 right-0 z-[55]
          flex flex-col
          overflow-hidden
          border border-slate-200
          bg-white
          shadow-2xl

          transition-transform duration-300 ease-out

          md:rounded-tl-2xl

          max-md:h-screen
          max-md:w-full
          max-md:rounded-none

          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{
          width:
            typeof window !== 'undefined' && window.innerWidth < 768
              ? '100%'
              : `${panelWidth}px`,

          height:
            typeof window !== 'undefined' && window.innerWidth < 768
              ? '100vh'
              : `${panelHeight}px`,

          /*
           * Disable transition while resizing so the panel
           * follows the pointer immediately.
           */
          transitionDuration: isResizing ? '0ms' : undefined,
        }}
      >
        {/* =======================================================
            Resize Handles
        ======================================================== */}

        {/* Left edge resize handle */}
        <div
          role="separator"
          aria-label="Resize AI Assistant width"
          onPointerDown={(event) => startResize('left', event)}
          className="
            absolute left-0 top-0 bottom-0
            z-[70]
            hidden
            w-2
            cursor-ew-resize
            md:block
          "
        >
          <div
            className="
              absolute left-0 top-1/2
              -translate-y-1/2
              opacity-0
              transition-opacity
              hover:opacity-100
            "
          >
            <GripVertical size={16} className="text-blue-500" />
          </div>
        </div>

        {/* Top edge resize handle */}
        <div
          role="separator"
          aria-label="Resize AI Assistant height"
          onPointerDown={(event) => startResize('top', event)}
          className="
            absolute left-0 right-0 top-0
            z-[70]
            hidden
            h-2
            cursor-ns-resize
            md:block
          "
        >
          <div
            className="
              absolute left-1/2 top-0
              -translate-x-1/2
              opacity-0
              transition-opacity
              hover:opacity-100
            "
          >
            <GripHorizontal size={16} className="text-blue-500" />
          </div>
        </div>

        {/* Top-left corner resize handle */}
        <div
          role="separator"
          aria-label="Resize AI Assistant"
          onPointerDown={(event) => startResize('corner', event)}
          className="
            absolute left-0 top-0
            z-[80]
            hidden
            h-5 w-5
            cursor-nwse-resize
            md:block
          "
        >
          <div
            className="
              absolute left-1 top-1
              h-3 w-3
              rounded-sm
              border-l-2
              border-t-2
              border-blue-500
            "
          />
        </div>

        {/* =======================================================
            Header
        ======================================================== */}

        <div
          className="
            flex shrink-0
            items-center justify-between
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            px-5 py-4
            text-white
          "
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Bot size={23} />
            </div>

            <div>
              <h2 className="text-sm font-bold">School AI Assistant</h2>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-[11px] font-medium text-blue-100">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="
              rounded-xl p-2
              text-white/80
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close AI Assistant"
          >
            <X size={21} />
          </button>
        </div>

        {/* =======================================================
            Messages
        ======================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`
                  flex
                  ${message.role === 'user' ? 'justify-end' : 'justify-start'}
                `}
              >
                {/* AI Avatar */}
                {message.role === 'assistant' && (
                  <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Bot size={17} />
                  </div>
                )}

                {/* Message */}
                <div
                  className={`
                    max-w-[92%]
                    rounded-2xl
                    px-4 py-3
                    text-sm
                    leading-6

                    ${
                      message.role === 'user'
                        ? `
                          rounded-br-md
                          bg-blue-600
                          text-white
                          shadow-sm
                        `
                        : `
                          min-w-0
                          rounded-bl-md
                          border border-slate-200
                          bg-white
                          text-slate-700
                          shadow-sm
                        `
                    }
                  `}
                >
                  {/* =================================================
                      USER MESSAGE
                  ================================================== */}

                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  ) : (
                    /* ===============================================
                       AI MARKDOWN MESSAGE
                    ================================================ */

                    <div className="max-w-full overflow-x-auto">
                      <div
                        className="
                          min-w-0
                          break-words

                          [&>p]:mb-2
                          [&>p:last-child]:mb-0

                          [&_strong]:font-bold
                          [&_em]:italic

                          [&_ul]:my-2
                          [&_ul]:list-disc
                          [&_ul]:pl-5

                          [&_ol]:my-2
                          [&_ol]:list-decimal
                          [&_ol]:pl-5

                          [&_li]:my-1

                          [&_h1]:mb-2
                          [&_h1]:mt-3
                          [&_h1]:text-lg
                          [&_h1]:font-bold
                          [&_h1]:text-slate-900

                          [&_h2]:mb-2
                          [&_h2]:mt-3
                          [&_h2]:text-base
                          [&_h2]:font-bold
                          [&_h2]:text-slate-900

                          [&_h3]:mb-2
                          [&_h3]:mt-3
                          [&_h3]:font-semibold
                          [&_h3]:text-slate-900

                          /* ==============================
                             TABLE
                          =============================== */

                          [&_table]:my-3
                          [&_table]:w-full
                          [&_table]:min-w-max
                          [&_table]:border-collapse
                          [&_table]:text-xs

                          [&_thead]:bg-slate-100

                          [&_th]:border
                          [&_th]:border-slate-200
                          [&_th]:px-3
                          [&_th]:py-2
                          [&_th]:text-left
                          [&_th]:font-semibold
                          [&_th]:text-slate-700
                          [&_th]:whitespace-nowrap

                          [&_td]:border
                          [&_td]:border-slate-200
                          [&_td]:px-3
                          [&_td]:py-2
                          [&_td]:text-slate-600
                          [&_td]:whitespace-nowrap

                          [&_tbody_tr:nth-child(even)]:bg-slate-50
                          [&_tbody_tr:hover]:bg-blue-50

                          /* ==============================
                             CODE
                          =============================== */

                          [&_code]:rounded
                          [&_code]:bg-slate-100
                          [&_code]:px-1
                          [&_code]:py-0.5
                          [&_code]:font-mono
                          [&_code]:text-xs

                          [&_pre]:my-3
                          [&_pre]:overflow-x-auto
                          [&_pre]:rounded-lg
                          [&_pre]:bg-slate-900
                          [&_pre]:p-3
                          [&_pre]:text-slate-100

                          [&_pre_code]:bg-transparent
                          [&_pre_code]:p-0
                          [&_pre_code]:text-xs
                          [&_pre_code]:text-slate-100

                          /* ==============================
                             LINKS
                          =============================== */

                          [&_a]:font-medium
                          [&_a]:text-blue-600
                          [&_a]:underline
                          [&_a:hover]:text-blue-800
                        "
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* =====================================================
                Loading
            ====================================================== */}

            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Bot size={17} />
                </div>

                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <Loader2 size={16} className="animate-spin" />

                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* =======================================================
            Input
        ======================================================== */}

        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <form onSubmit={handleSubmit}>
            <div
              className="
                flex items-center gap-2
                rounded-2xl
                border border-slate-200
                bg-slate-50
                px-3 py-2
                transition
                focus-within:border-blue-500
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-blue-100
              "
            >
              <MessageCircle size={18} className="shrink-0 text-slate-400" />

              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask your AI assistant..."
                disabled={loading}
                className="
                  min-w-0 flex-1
                  bg-transparent
                  py-1
                  text-sm
                  text-slate-800
                  outline-none
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                "
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-blue-600
                  text-white
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                "
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </form>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            AI responses may contain mistakes. Verify important information.
          </p>
        </div>
      </div>
    </>
  );
}

export default AIChatAssistant;
