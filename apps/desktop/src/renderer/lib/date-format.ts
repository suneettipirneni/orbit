const dueDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDueDate(value: string) {
  return dueDateFormatter.format(new Date(value));
}
