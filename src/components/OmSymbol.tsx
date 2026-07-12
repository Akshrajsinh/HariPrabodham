interface OmSymbolProps {
  size?: number;
  className?: string;
}

export default function OmSymbol({ size = 28, className = '' }: OmSymbolProps) {
  return (
    <span
      aria-hidden
      className={`font-display leading-none select-none ${className}`}
      style={{ fontSize: size }}
    >
      ॐ
    </span>
  );
}
