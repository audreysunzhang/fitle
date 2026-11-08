import type { Item } from "@/lib/game/types";
import styles from "./game.module.css";

const SHAPES: Record<string, React.ReactNode> = {
  shirt: (
    <path d="M40 20 25 26 8 46l14 12 10-10v56h56V48l10 10 14-12-17-20-15-6c-4 10-14 14-20 14s-16-4-20-14Z" />
  ),
  jeans: <path d="M36 12h48l10 96H68l-8-56-8 56H26Z" />,
  dress: <path d="m48 12 4 18h16l4-18 8 4-4 28-6 12 26 52H24l26-52-6-12-4-28Z" />,
  jacket: (
    <>
      <path d="M42 18 24 26 10 98h18l8-42v50h48V56l8 42h18L96 26l-18-8-18 16Z" />
      <path d="M60 36v70" stroke="var(--plate-bg)" strokeWidth="2" fill="none" />
    </>
  ),
  shoe: <path d="M10 62c0-10 4-18 8-22l18 10c8 6 20 12 36 16 20 4 38 6 38 22v4H10Z" />,
  bag: (
    <>
      <path d="M30 48h60l10 56H20Z" />
      <path d="M42 50V36c0-16 36-16 36 0v14" stroke="currentColor" strokeWidth="6" fill="none" />
    </>
  ),
  hat: <path d="M20 72c0-32 20-44 40-44 24 0 38 16 38 44 10 2 18 8 20 14-28-8-68-10-98-8Z" />,
  ring: (
    <>
      <circle cx="60" cy="72" r="28" stroke="currentColor" strokeWidth="7" fill="none" />
      <path d="m60 16 14 14-14 16-14-16Z" />
    </>
  ),
};

export function ItemImage({ item, compact }: { item: Item; compact: boolean }) {
  const placeholder = item.imageUrl.startsWith("placeholder:");
  const shape = SHAPES[item.imageUrl.replace("placeholder:", "")] ?? SHAPES.shirt;

  return (
    <figure className={styles.plate} data-tier={item.tier} data-compact={compact}>
      {placeholder ? (
        <div className={styles.plateArt} role="img" aria-label={item.imageAlt}>
          <svg viewBox="0 0 120 120" fill="currentColor" aria-hidden="true">
            {shape}
          </svg>
          <span className={styles.plateName} aria-hidden="true">
            {item.name}
          </span>
        </div>
      ) : (
        // Real images will come from arbitrary licensed feed hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.plateImage} src={item.imageUrl} alt={item.imageAlt} />
      )}
      {item.imageCredit && <figcaption>{item.imageCredit}</figcaption>}
    </figure>
  );
}
