
import React, { useEffect, useState } from 'react';

interface ConfettiProps {
    onComplete: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
    const [confettiPieces, setConfettiPieces] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const pieces = Array.from({ length: 100 }).map((_, i) => (
            <div
                key={i}
                className="confetti"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: `hsl(${Math.random() * 360}, 90%, 65%)`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                }}
            />
        ));
        setConfettiPieces(pieces);

        const timer = setTimeout(() => {
            onComplete();
        }, 3000 + 2000); // animation duration + max delay

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{confettiPieces}</>;
};

export default Confetti;
