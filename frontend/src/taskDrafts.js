export const MAX_TASK_TITLE_LENGTH = 100;

export const taskDraftKey = (categoryId, columnId) =>
  JSON.stringify([categoryId, columnId]);

export function updateTaskDrafts(drafts, categoryId, columnId, value) {
  if (!categoryId) return drafts;
  const key = taskDraftKey(categoryId, columnId);
  const title = value.slice(0, MAX_TASK_TITLE_LENGTH);
  if (title === "") {
    if (!(key in drafts)) return drafts;
    const next = { ...drafts };
    delete next[key];
    return next;
  }
  if (drafts[key] === title) return drafts;
  return { ...drafts, [key]: title };
}
