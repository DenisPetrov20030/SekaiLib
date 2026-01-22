export const renderLiteraryText = (rawText: string) => {
  if (!rawText) return null;

  return rawText.split('\n').map((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return <br key={index} />; 

    return (
      <p key={index} className="novel-paragraph">
        {trimmed}
      </p>
    );
  });
};