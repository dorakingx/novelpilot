import type { StoryProject } from "./types";

// TODO: embedded-font jsPDF for direct Japanese PDF download
export function printNovelPdf(project: StoryProject): void {
  const oldTitle = document.title;
  const safe = (project.title || "NovelPilot Novel").replace(/[<>:"/\\|?*]/g, "");
  document.title = safe;
  window.print();
  setTimeout(() => {
    document.title = oldTitle;
  }, 1000);
}
