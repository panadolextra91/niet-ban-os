import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    notifications: string[];
}

const SocketContext = createContext<SocketContextType>({ socket: null, notifications: [] });

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

interface DonationData {
    email: string;
    amount: number;
}

interface JackpotData {
    email: string;
}

interface ChillData {
    message?: string;
}

export const SocketProvider: React.FC<{ children: React.ReactNode, accessToken?: string | null }> = ({ children, accessToken }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<string[]>([]);

    useEffect(() => {
        const token = accessToken || localStorage.getItem('accessToken');
        if (!token) {
            console.log('[SocketProvider] No token found, skipping connection.');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSocket(prev => prev ? null : prev);
            return;
        }

        console.log('[SocketProvider] Connecting to Temple Socket...');
        const s = io('http://localhost:3000/temple', {
            auth: { token: `Bearer ${token}` },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        s.on('connect', () => {
            console.log('[SocketProvider] Connected to Temple Socket. ID:', s.id);
            setSocket(s);
        });

        s.on('marquee_new_prayer', (data: DonationData) => {
            console.log('[SocketProvider] marquee_new_prayer received:', data);
            setNotifications(prev => [`🙏 ${data.email} vừa cúng dường ${data.amount}đ!`, ...prev.slice(0, 4)]);
        });

        s.on('global_jackpot_alert', (data: JackpotData) => {
            setNotifications(prev => [`🔥 CHÚC MỪNG: ${data.email} nổ hũ karma khủng!`, ...prev.slice(0, 4)]);
        });

        s.on('chill_thoi_thi_chu', (data: ChillData) => {
            alert(data.message || '🛑 Chill thôi thí chủ! Gõ chậm lại chút.');
        });

        s.on('disconnect', (reason) => {
            console.log('[SocketProvider] Socket disconnected. Reason:', reason);
            setSocket(null);
        });

        s.on('connect_error', (err: Error) => {
            console.error('[SocketProvider] Connection Trace:', err.message);
        });

        return () => {
            console.log('[SocketProvider] Component unmounting or token changed, disconnecting socket.');
            s.disconnect();
        };
    }, [accessToken]);

    return (
        <SocketContext.Provider value={{ socket, notifications }}>
            {children}
        </SocketContext.Provider>
    );
};
