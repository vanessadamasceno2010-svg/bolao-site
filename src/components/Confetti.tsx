import { useEffect, useState } from 'react';

const COLORS = ['#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const SHAPES = ['●','■','▲','★','⚽','🏆'];

type Particle = {
  id: number;
  x: number;
  color: string;
  shape: string;
  size: number;
  delay: number;
  duration: number;
};

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const p: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 8 + Math.random() * 16,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
    }));
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), 5500);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            color: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        >
          {p.shape}
        </div>
      ))}
    </div>
  );
}
