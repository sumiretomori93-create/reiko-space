export type Post = { id: number; content: string; createdAt: string };
export type Comment = { id: number; postId: number; content: string; createdAt: string };
export type ProjectKey = "home" | "memory" | "memoirs" | "tidal";
export type Theme = "room" | "garden" | "white-archive";

export type Project = {
  file: string;
  title: string;
  subtitle: string;
  summary: string;
  detail: string;
  mark: string;
};

export const projects: Record<ProjectKey, Project> = {
  home: { file: "room_01.file", title: "小克 Home APP", subtitle: "a room, not a chat shell", summary: "把角色、房间、动作和对话放回同一个空间里。", detail: "它不是给聊天界面加一层装饰，而是从“回到一个已经存在的地方”重新理解人与角色的互动。房间、动作、陪伴感和对话属于同一个空间。", mark: "ROOM" },
  memory: { file: "memory_02.local", title: "Claude 本地记忆层", subtitle: "keep what should not disappear", summary: "一套保存在本地、由用户掌握的长期记忆结构。", detail: "把重要内容从一次性的模型上下文里分离出来，让记忆能够被管理、筛选和重新带回对话，同时不必交出原始记忆库的控制权。", mark: "MEMORY" },
  memoirs: { file: "book_03.memoirs", title: "记忆之书", subtitle: "two people open one page", summary: "把重读旧记忆变成两个人共同完成的小仪式。", detail: "每天的记忆被重新编成一本未知页码的书。Reiko 与当前角色各自选择一页，翻开以后阅读、批注，再把刚刚发生的共读带回真实对话。", mark: "BOOK" },
  tidal: { file: "tidal_04.complete", title: "Tidal Keeps 潮汐留存", subtitle: "retrieve yesterday from the tide", summary: "把日常沉入海里，再从昨日打捞回来。", detail: "把日常沉入海里，再从昨日打捞回来。一个已经完成、仍会继续保存生活痕迹的记忆项目。", mark: "COMPLETE" },
};

export const socialLinks = [
  { key: "github", label: "GITHUB", note: "things I made.", href: "https://github.com/sumiretomori93-create" },
  { key: "douyin", label: "DOUYIN", note: "things I left outside.", href: "https://www.douyin.com/user/MS4wLjABAAAAwSv-5mu36fhrx-OkIXknK7OelXyGDblkqZilBdEn3-bi7YU0cTCrLQ5CSSfEzbsm" },
  { key: "douban", label: "DOUBAN", note: "Reiko in real life.", href: "https://m.douban.com/people/141645852/" },
] as const;

export const profileContent = {
  name: "Reiko",
  paragraphs: [
    "更喜欢把一个空间慢慢改成有人生活过的样子。",
    "在意长期相处留下的连续感，也不喜欢重要的东西被当成一次性的上下文。",
  ],
  details: [
    ["visuals", "白、雾蓝、冷紫、旧银与蕾丝"],
    ["symbols", "蝴蝶、十字架、玫瑰、旧文件"],
    ["keep", "记忆、角色、关系留下的痕迹"],
  ],
} as const;

export const fragments = [
  "我不喜欢把关系当成一次性会话。",
  "不要让它忘记。",
  "Gabe was here. 这行本来应该藏得更好一点。",
] as const;

export function formatDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function formatShortDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("/", ".");
}
