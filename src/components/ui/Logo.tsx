import Image from "next/image";

export function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="nayaGhar"
      width={size}
      height={size}
      className="object-contain justify-center"
    />
  );
}

export function LogoFull({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <Image
        src="/logo.png"
        alt="UrbanNest"
        width={iconSize}
        height={iconSize}
        className="object-contain"
      />
      <span className="text-lg font-bold tracking-tight">
        Urban<span className="text-[var(--accent)]">Nest</span>
      </span>
    </div>
  );
}
