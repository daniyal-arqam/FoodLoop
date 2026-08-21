export function RevealHeading({ as: Tag = "h1", lines, className = "" }) {
  return (
    <Tag className={`reveal-heading ${className}`.trim()}>
      {lines.map((line) => (
        <span className="reveal-line" key={line}>
          <span className="reveal-line-inner">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
