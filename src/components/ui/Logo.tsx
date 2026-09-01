import Image from "next/image";

export function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="NayaGhar"
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
