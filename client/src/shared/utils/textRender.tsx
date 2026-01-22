export const renderChapterContent = (content: string) => {
  if (!content) return null;

  return content.split('\n').map((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return <br key={index} />;

    const isSceneDivider = trimmed === '***' || trimmed === '* * *';

    const isDialog = trimmed.startsWith('—') || trimmed.startsWith('-');
    
    const isFootnoteLine = /^\[\d+\]:/.test(trimmed);

    const formatWithNotes = (text: string) => {
      const parts = text.split(/(\[\d+\])/g);
      return parts.map((part, i) => {
        if (part.match(/^\[\d+\]$/)) {
          return (
            <i key={i} className="opacity-70 font-serif italic text-[0.9em]">
              {part}
            </i>
          );
        }
        return part;
      });
    };

    return (
      <p 
        key={index} 
        className={`novel-paragraph 
          ${isSceneDivider ? 'text-center text-2xl my-8 tracking-[0.5em] opacity-100 font-bold' : ''}
          ${isDialog ? 'is-dialog' : ''} 
          ${isFootnoteLine ? 'is-footnote italic opacity-80 text-[0.95em]' : ''}`}
      >
        {isSceneDivider ? trimmed : formatWithNotes(trimmed)}
      </p>
    );
  });
};