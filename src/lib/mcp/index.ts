import { defineMcp } from "@lovable.dev/mcp-js";
import searchMessages from "./tools/search-messages";
import recentMessages from "./tools/recent-messages";
import listChats from "./tools/list-chats";
import alyssaProjects from "./tools/alyssa-projects";
import alyssaJobs from "./tools/alyssa-jobs";

export default defineMcp({
  name: "alisa-bot-mcp",
  title: "Alisa Telegram Bot MCP",
  version: "0.1.0",
  instructions:
    "Tools for browsing the Alisa Telegram bot's stored conversations. Use `list_chats` to discover chats, `recent_messages` to page through a chat, and `search_messages` for text lookup.",
  tools: [searchMessages, recentMessages, listChats, alyssaProjects, alyssaJobs],
});
