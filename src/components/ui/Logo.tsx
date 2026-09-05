import Image from "next/image";

// The logo artwork is landscape (343×210). `size` is the rendered height;
// width follows the true aspect ratio so the mark never letterboxes.
export function LogoIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="NayaGhar"
      width={Math.round((size * 343) / 210)}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

export function LogoFull({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <Image
        src="/logo.png"
        alt="NayaGhar"
        width={iconSize}
        height={iconSize}
        className="object-contain"
      />
      <span className="font-display text-lg font-extrabold tracking-tight text-[var(--ink)]">
        Naya<span className="text-[var(--brick)]">Ghar</span>
      </span>
    </div>
  );
}
