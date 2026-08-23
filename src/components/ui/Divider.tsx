export default function Divider({ className = '' }: { className?: string }) {
  return (
    <hr
      className={className}
      style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0' }}
    />
  );
}
