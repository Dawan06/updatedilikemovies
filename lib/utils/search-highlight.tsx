export function highlightSearchTerm(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim() || !text) return text;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark key={index} className="bg-primary/30 text-primary-foreground px-0.5 rounded">
          {part}
        </mark>
      );
    }
    return part;
  });
}
