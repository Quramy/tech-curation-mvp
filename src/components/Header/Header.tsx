import Link from "next/link";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Tech Digest
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Digest</Link>
          <Link href="/feeds">Feeds</Link>
        </nav>
      </div>
    </header>
  );
}
