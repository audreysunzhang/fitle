import Link from "next/link";

export const metadata = { title: "Privacy · Cop or Drop" };

export default function Privacy() {
  return (
    <main className="prose">
      <p>
        <Link href="/">← Back to the game</Link>
      </p>
      <h1>Privacy</h1>
      <p>We collect no personal data. No accounts, names, or email addresses.</p>
      <h2>Stored on your device</h2>
      <p>
        Your browser&apos;s local storage holds your guesses, votes, stats, streak, and a random
        anonymous player ID. It never leaves your device today, and clearing your site data erases
        it.
      </p>
      <h2>Coming later</h2>
      <p>
        When real crowd results launch, your anonymous player ID, guesses, and Cop/Drop votes will
        be sent to our server so they can be counted, with nothing that identifies you. This page
        will be updated first.
      </p>
    </main>
  );
}
