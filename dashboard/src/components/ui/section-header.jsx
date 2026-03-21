export function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-muted-foreground" />}
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
