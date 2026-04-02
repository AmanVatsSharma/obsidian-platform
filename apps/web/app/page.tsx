export default function Index() {
  return (
    <div style={{ padding: 24 }}>
      <h1>NestTrade Trader Web</h1>
      <ul>
        <li>
          <a href="/(auth)/request-otp">Request OTP</a>
        </li>
        <li>
          <a href="/(auth)/verify-otp">Verify OTP</a>
        </li>
        <li>
          <a href="/dashboard">Dashboard (Protected)</a>
        </li>
        <li>
          <a href="/workstation">Trading Workstation (Protected)</a>
        </li>
        <li>
          <a href="/m/workstation">Mobile Workstation (Protected)</a>
        </li>
        <li>
          <a href="/onboarding">Onboarding Scaffold</a>
        </li>
        <li>
          <a href="/portfolio">Portfolio Scaffold</a>
        </li>
        <li>
          <a href="/orders">Orders Scaffold</a>
        </li>
        <li>
          <a href="/funds">Funds Scaffold</a>
        </li>
        <li>
          <a href="/settings">Settings Scaffold</a>
        </li>
      </ul>
    </div>
  );
}
