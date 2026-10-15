import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Sleek, high-performance top loading progress bar that animates across page route transitions.
 * Eliminates direct abrupt jumps and provides a refined, authentic feel.
 */
export default function PageProgressBar() {
  const { pathname } = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(25);

    const timer1 = setTimeout(() => setProgress(65), 80);
    const timer2 = setTimeout(() => setProgress(90), 160);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setVisible(false), 240);
    }, 280);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  if (!visible && progress === 100) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2.5px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-linear-to-r from-orange-500 via-amber-400 to-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
