/** Dev tools route that throws during render, to prove the error boundary + logging work. */
export default function CrashPage(): never {
  throw new Error('Deliberate crash from Dev tools (testing the error boundary)');
}
