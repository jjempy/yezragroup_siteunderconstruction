export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 40 40">
      <circle className="spark" cx="27" cy="14" r="6.6" />
      <circle className="primary" cx="18" cy="21" r="11.5" />
    </svg>
  );
}
