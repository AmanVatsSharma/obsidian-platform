import '../styles/dashboard.css';
import '../styles/mobile.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isMobileRoute = router.pathname.startsWith('/mobile');
    if (isMobile && !isMobileRoute) {
      router.replace('/mobile');
    } else {
      setReady(true);
    }
  }, []);

  if (!ready && typeof window !== 'undefined' && window.innerWidth < 768) {
    return <div style={{ background:'#06080A', height:'100vh', width:'100%' }} />;
  }

  return <Component {...pageProps} />;
}
