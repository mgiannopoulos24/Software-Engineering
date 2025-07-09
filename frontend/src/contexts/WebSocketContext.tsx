// frontend/src/contexts/WebSocketContext.tsx

import { Client, StompSubscription } from '@stomp/stompjs';
import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { toast } from 'sonner';
import { CollisionNotificationDTO, ZoneViolationNotificationDTO } from '@/types/types';

// Ορίζουμε τον τύπο για το Context μας
interface WebSocketContextType {
    client: Client | null;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Το custom hook για να το χρησιμοποιούμε εύκολα
export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

// Το Provider component
export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { addNotification } = useNotifications();
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        // Αν δεν υπάρχει χρήστης, αποσυνδεόμαστε και καθαρίζουμε.
        if (!currentUser) {
            if (clientRef.current && clientRef.current.active) {
                console.log('🔌 WebSocketProvider: No user, deactivating client.');
                clientRef.current.deactivate();
            }
            setIsConnected(false);
            return;
        }

        // Δημιουργούμε νέο client μόνο αν δεν υπάρχει ήδη.
        if (!clientRef.current) {
            clientRef.current = new Client({
                webSocketFactory: () => new SockJS('/ws-ais'),
                reconnectDelay: 5000,
                heartbeatOutgoing: 10000,
                heartbeatIncoming: 0,
            });
        }

        const client = clientRef.current;

        // --- Callbacks για τη διαχείριση της σύνδεσης ---
        client.onConnect = () => {
            console.log('✅ WebSocketProvider: Global STOMP Client Connected!');
            setIsConnected(true);

            // --- ΚΕΝΤΡΙΚΗ ΛΟΓΙΚΗ ΤΩΝ SUBSCRIPTIONS ---
            // Κάνουμε subscribe εδώ, μόλις η σύνδεση είναι ενεργή.
            const subscriptions: StompSubscription[] = [];

            // 1. Subscription για τις ειδοποιήσεις παραβίασης ζωνών
            console.log('Subscribing to /user/queue/notifications...');
            subscriptions.push(
                client.subscribe('/user/queue/notifications', (message) => {
                    try {
                        const violation: ZoneViolationNotificationDTO = JSON.parse(message.body);
                        const title = `Violation in "${violation.zoneName}"`;
                        const description = violation.message;
                        toast.warning(title, { description, duration: 8000 });
                        addNotification({ type: 'violation', title, description });
                    } catch(e) { console.error("Error parsing violation notification", e); }
                })
            );
            console.log('✅ WebSocketProvider: Subscribed to /user/queue/notifications');

            // 2. Subscription για τις ειδοποιήσεις σύγκρουσης
            console.log('Subscribing to /user/queue/collision-alerts...');
            subscriptions.push(
                client.subscribe('/user/queue/collision-alerts', (message) => {
                    try {
                        const alert: CollisionNotificationDTO = JSON.parse(message.body);
                        const title = `⚠️ Collision Alert in "${alert.zoneName}"`;
                        const description = alert.message;
                        toast.error(title, { description, duration: 15000 });
                        addNotification({ type: 'collision', title, description });
                    } catch(e) { console.error("Error parsing collision alert", e); }
                })
            );
            console.log('✅ WebSocketProvider: Subscribed to /user/queue/collision-alerts');

            console.log('All private subscriptions established.');
            // Αποθηκεύουμε τις συνδρομές στο client object για να μπορούμε να τις κλείσουμε μετά.
            (client as any).activeSubscriptions = subscriptions;
        };

        client.onDisconnect = () => {
            console.log('🔌 WebSocketProvider: Global STOMP Client Disconnected.');
            setIsConnected(false);
        };

        client.onStompError = (frame) => {
            console.error('WebSocketProvider STOMP Error:', frame.headers['message'], frame.body);
            toast.error("WebSocket Error", { description: "A connection error occurred. Please refresh the page."});
        };

        // --- ΕΝΕΡΓΟΠΟΙΗΣΗ ΤΟΥ CLIENT ---
        const token = localStorage.getItem('token');
        if (token) {
            client.connectHeaders = { Authorization: `Bearer ${token}` };
            console.log('Attempting to activate WebSocket client...');
            client.activate();
        } else {
            console.log('No token found, WebSocket client not activated.');
        }

        // --- CLEANUP FUNCTION ---
        return () => {
            const activeClient = clientRef.current;
            if (activeClient?.active) {
                console.log('🧹 WebSocketProvider: Cleaning up and deactivating client.');
                activeClient.deactivate();
                setIsConnected(false);
            }
        };

    }, [currentUser, addNotification]);

    const value = {
        client: clientRef.current,
        isConnected,
    };

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};