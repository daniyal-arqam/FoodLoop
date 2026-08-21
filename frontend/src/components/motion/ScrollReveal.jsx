export function ScrollReveal({ children, className = "", stagger = false, as: Tag = "div" }) {
  return (
    <Tag className={className} {...(stagger ? { "data-stagger": "" } : { "data-reveal": "" })}>
      {children}
    </Tag>
  );
}
