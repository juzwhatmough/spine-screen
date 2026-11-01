// Dashed empty-state box (web/REDESIGN_SPEC.md section 5.7), shared by
// Books and Shows for all three cases: no search matches, no filter
// matches, and nothing in the Finished view.
export function EmptyState({
  heading,
  message,
  action,
}: {
  heading: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mq-empty">
      <p className="mq-empty-heading">{heading}</p>
      <p className="mq-empty-message">{message}</p>
      {action}
    </div>
  );
}
