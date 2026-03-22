import Link from "next/link";

type BrandIconProps = {
  size?: number;
  className?: string;
  label?: string;
  withText?: boolean;
  href?: string;
};

export function BrandIcon({
  size = 24,
  className,
  label = "pwk-cms",
  withText = true,
  href = "/",
}: BrandIconProps) {
  const iconSize = Math.max(16, size);

  const content = (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <div
        className="inline-flex items-center justify-center rounded-xl bg-cms-accent"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width={iconSize * 0.65}
          height={iconSize * 0.65}
          className="text-cms-accent-text"
        >
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {withText && (
        <span className="font-mono text-sm font-medium text-cms-text tracking-tight">
          {label}
        </span>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center no-underline">
      {content}
    </Link>
  );
}
