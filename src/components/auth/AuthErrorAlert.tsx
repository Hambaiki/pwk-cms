interface AuthErrorAlertProps {
  messages?: string[];
}

export function AuthErrorAlert({ messages }: AuthErrorAlertProps) {
  if (!messages || messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-cms-danger-border bg-cms-danger-subtle px-4 py-3"
    >
      {messages.map((msg) => (
        <p key={msg} className="text-sm text-cms-danger">
          {msg}
        </p>
      ))}
    </div>
  );
}
