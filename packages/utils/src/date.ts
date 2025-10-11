export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-DE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
