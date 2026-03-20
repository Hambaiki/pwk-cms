interface AuthErrorAlertProps {
  messages?: string[]
}

export function AuthErrorAlert({ messages }: AuthErrorAlertProps) {
  if (!messages || messages.length === 0) return null

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3"
    >
      {messages.map((msg) => (
        <p key={msg} className="text-sm text-red-400">
          {msg}
        </p>
      ))}
    </div>
  )
}
