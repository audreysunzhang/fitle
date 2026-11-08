"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./game.module.css";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      <div className={styles.modalBody}>
        <div className={styles.modalHead}>
          <h2 id={titleId}>{title}</h2>
          <button className={styles.textButton} onClick={() => ref.current?.close()}>
            Close
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
