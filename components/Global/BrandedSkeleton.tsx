type BrandedSkeletonBlockProps = {
  className?: string;
  strong?: boolean;
};

export default function BrandedSkeletonBlock({
  className = "",
  strong = false,
}: BrandedSkeletonBlockProps) {
  return (
    <div
      className={`rounded ${strong ? "bg-[var(--color-primary)]" : "bg-[var(--color-default)]"} ${className}`}
      style={{
        backgroundColor: strong
          ? "color-mix(in srgb, var(--color-primary) 64%, white)"
          : "color-mix(in srgb, var(--color-primary) 18%, white)",
      }}
    />
  );
}
