import styles from './page.module.css';

export default function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.css file.
   */
  return (
    <div style={{ padding: 24 }}>
      <h1>Next App</h1>
      <ul>
        <li><a href="/(auth)/request-otp">Request OTP</a></li>
        <li><a href="/(auth)/verify-otp">Verify OTP</a></li>
        <li><a href="/dashboard">Dashboard (Protected)</a></li>
      </ul>
    </div>
  );
}
