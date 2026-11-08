import { HOST_NAME, MAX_GUESSES } from "@/lib/game/config";
import styles from "./game.module.css";
import { Modal } from "./Modal";

export function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <ol className={styles.howTo}>
        <li>Three new pieces every day: one budget, one mid, one bougie.</li>
        <li>
          Guess each full price in {MAX_GUESSES} tries. Within 10% wins. ⬆️ ⬇️ point the way, 🔥
          means you&apos;re within 25%, and each miss earns a clue.
        </li>
        <li>
          Once the price is out, vote: <strong>COP</strong> if you&apos;d buy it at that price,{" "}
          <strong>DROP</strong> if you wouldn&apos;t. Then see how the crowd voted.
        </li>
        <li>{HOST_NAME} will have opinions. Share your card, keep your streak.</li>
      </ol>
    </Modal>
  );
}
