"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  Trash2,
  Loader2,
  Sparkles,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, memo, useCallback } from "react";
import useSWR from "swr";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
}

interface HistoryResponse {
  chats: Chat[];
  hasMore: boolean;
  nextCursor: string | null;
}

function groupChatsByDate(chats: Chat[]): Record<string, Chat[]> {
  const groups: Record<string, Chat[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  chats.forEach((chat) => {
    const date = new Date(chat.createdAt);
    if (date >= today) groups.Today.push(chat);
    else if (date >= yesterday) groups.Yesterday.push(chat);
    else if (date >= lastWeek) groups["This Week"].push(chat);
    else groups.Earlier.push(chat);
  });

  return groups;
}

const ChatItem = memo(function ChatItem({
  chat,
  isActive,
  onDelete,
  onNavigate,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (id: string) => void;
  onNavigate?: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isDeleting) return;
      setIsDeleting(true);
      try {
        await fetch(`/api/chat/${chat.id}`, { method: "DELETE" });
        onDelete(chat.id);
      } catch {
        setIsDeleting(false);
      }
    },
    [chat.id, isDeleting, onDelete]
  );

  return (
    <Link
      href={`/chat/${chat.id}`}
      onClick={() => onNavigate?.()}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200",
        isActive
          ? "bg-primary/15 text-primary border border-primary/20"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      )}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      <span className="truncate flex-1">
        {chat.title || "New conversation"}
      </span>

      {showDelete && !isDeleting && (
        <button
          onClick={handleDelete}
          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {isDeleting && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      )}
    </Link>
  );
});

const groupIcons: Record<string, React.ReactNode> = {
  Today: <Sparkles className="w-3.5 h-3.5" />,
  Yesterday: <Clock className="w-3.5 h-3.5" />,
  "This Week": <Zap className="w-3.5 h-3.5" />,
  Earlier: <Clock className="w-3.5 h-3.5" />,
};

const SIDEBAR_WIDTH = 280;

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const fetcher = useCallback(async (url: string): Promise<HistoryResponse> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  }, []);

  const { data, isLoading, mutate } = useSWR<HistoryResponse>(
    "/api/history?limit=50",
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 10000 }
  );

  const handleDelete = useCallback(
    (id: string) => {
      mutate(
        (current) =>
          current
            ? {
                ...current,
                chats: current.chats.filter((c) => c.id !== id),
              }
            : current,
        { revalidate: false }
      );
    },
    [mutate]
  );

  const handleNewSession = useCallback(() => {
    router.push("/chat");
    router.refresh();
    onNavigate?.();
  }, [router, onNavigate]);

  const groupedChats = data?.chats ? groupChatsByDate(data.chats) : null;

  return (
    <div className="relative h-full flex">
      <div
        className="h-full overflow-hidden transition-all duration-300"
        style={{ width: isOpen ? SIDEBAR_WIDTH : 0 }}
      >
        <div
          className={cn(
            "h-full flex flex-col",
            "bg-card/95 backdrop-blur-xl",
            "border-r border-border/30",
            "m-3 mr-0 rounded-2xl",
            "shadow-xl shadow-black/10"
          )}
          style={{ width: SIDEBAR_WIDTH - 24 }}
        >
          {/* New Session Button */}
          <div className="p-4">
            <button
              onClick={handleNewSession}
              className={cn(
                "flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl",
                "bg-primary text-primary-foreground font-semibold",
                "hover:bg-primary/90 transition-all duration-200",
                "shadow-lg shadow-primary/20 group"
              )}
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>New Chat</span>
            </button>
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : groupedChats &&
              Object.values(groupedChats).some((g) => g.length > 0) ? (
              Object.entries(groupedChats).map(
                ([title, chats]) =>
                  chats.length > 0 && (
                    <div key={title} className="space-y-1">
                      <div className="flex items-center gap-2 px-3 mb-2">
                        <span className="text-muted-foreground">
                          {groupIcons[title]}
                        </span>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {title}
                        </h3>
                        <span className="text-xs text-muted-foreground/50 ml-auto">
                          {chats.length}
                        </span>
                      </div>
                      {chats.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={pathname === `/chat/${chat.id}`}
                          onDelete={handleDelete}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  )
              )
            ) : (
              <div className="px-3 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3 border border-border/50">
                  <MessageSquare className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No conversations
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a new chat
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/30">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-50" />
              </div>
              <span className="text-xs text-muted-foreground">
                Kwala Network
              </span>
              <span className="text-xs text-green-400 ml-auto">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50",
          "w-6 h-16 flex items-center justify-center",
          "bg-card/90 backdrop-blur-sm",
          "border border-border/50",
          "hover:bg-muted transition-all duration-200",
          "shadow-lg shadow-black/10",
          isOpen ? "rounded-r-xl" : "rounded-xl",
          "hover:w-8"
        )}
        style={{
          left: isOpen ? SIDEBAR_WIDTH - 12 : 0,
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <ChevronLeft
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            !isOpen && "rotate-180"
          )}
        />
      </button>
    </div>
  );
}
