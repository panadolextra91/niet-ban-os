import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { useSocket } from '../context/SocketContext';

export const MoComponent: React.FC = () => {
    const { socket } = useSocket();
    const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);

    // Play sound helper
    const playSound = () => {
        const audio = new Audio('/coc.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
    };

    // Debounced Socket Call - Debounce 100ms to allow "fast" but not "tool" speed
    const syncKnock = useMemo(
        () => debounce(() => {
            if (socket) {
                socket.emit('knock_mo');
            }
        }, 100),
        [socket]
    );

    const handleClick = (e: React.MouseEvent) => {
        playSound();
        syncKnock();

        const id = Date.now();
        setClicks(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);

        // Remove after animation
        setTimeout(() => {
            setClicks(prev => prev.filter(c => c.id !== id));
        }, 1000);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[400px]">
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClick}
                className="cursor-pointer select-none"
            >
                <div className="w-64 h-64 bg-temple-red rounded-full flex items-center justify-center shadow-2xl border-8 border-temple-gold overflow-hidden">
                    <span className="text-6xl text-temple-gold font-bold">MÕ</span>
                </div>
            </motion.div>

            <h2 className="mt-8 text-2xl font-bold text-stone-700">Gõ mõ tích đức 🙏</h2>
            <p className="text-stone-500">Mỗi lần gõ +1 điểm công đức</p>

            <AnimatePresence>
                {clicks.map(click => (
                    <motion.div
                        key={click.id}
                        initial={{ opacity: 1, y: click.y - 20, x: click.x }}
                        animate={{ opacity: 0, y: click.y - 120 }}
                        exit={{ opacity: 0 }}
                        className="fixed pointer-events-none text-2xl font-bold text-temple-gold z-50"
                    >
                        +1 Karma
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
