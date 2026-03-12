import React, { useEffect, useState } from 'react';
import { subscribeToConnectionStatus, subscribeToUnits, subscribeToCommittees, subscribeToAttendance, forceRepairAllUnits, initializeData, getFirestoreError, testFirestoreConnection } from '../services/firebaseService';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

const SyncDebug: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [unitsCount, setUnitsCount] = useState<number | null>(null);
    const [committeesCount, setCommitteesCount] = useState<number | null>(null);
    const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [isRepairing, setIsRepairing] = useState(false);
    const [configStatus, setConfigStatus] = useState<string>('Unknown');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check config from initialized app
        try {
            const app = getApp();
            const options = app.options;
            if (!options.apiKey) setConfigStatus('MISSING API KEY (App Options)');
            else setConfigStatus(`Loaded (${options.apiKey.substring(0, 4)}...)`);
        } catch (e) {
            setConfigStatus('App Not Initialized');
        }

        // Check Auth continuously
        const auth = getAuth();
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsConnected(true);
                setAuthError(null);
            } else {
                setIsConnected(false);
                setAuthError("Not signed in (Anonymous Auth pending or failed)");
            }
        }, (error) => {
            setAuthError(error.message);
        });

        // RDB connection check might be false negative if RDB not enabled.
        const unsubConnection = subscribeToConnectionStatus((status) => setIsConnected(status));

        const unsubUnits = subscribeToUnits((units) => {
            setUnitsCount(units.length);
        });

        const unsubCommittees = subscribeToCommittees((committees) => {
            setCommitteesCount(committees.length);
        });

        const unsubAttendance = subscribeToAttendance((sessions) => {
            setAttendanceCount(sessions.length);
        });

        // Global error handler for this component context
        const errorHandler = (event: ErrorEvent) => {
            setLastError(event.message);
        };
        window.addEventListener('error', errorHandler);

        // Periodically check for Firestore-specific errors that might not trigger window error
        const errorCheckInterval = setInterval(() => {
            const fsError = getFirestoreError();
            if (fsError) {
                setLastError(`Firestore: ${fsError.message || fsError.code || JSON.stringify(fsError)}`);
            }
        }, 2000);

        return () => {
            unsubAuth();
            unsubConnection();
            unsubUnits();
            unsubCommittees();
            unsubAttendance();
            window.removeEventListener('error', errorHandler);
            clearInterval(errorCheckInterval);
        };
    }, []);

    const handleForceRepair = async () => {
        setIsRepairing(true);
        try {
            await forceRepairAllUnits();
            setLastError("Réparation terminée. Vérifiez les compteurs.");
        } catch (e: any) {
            setLastError("Erreur réparation: " + e.message);
        } finally {
            setIsRepairing(false);
        }
    };

    const handleInit = async () => {
        setIsRepairing(true);
        try {
            await initializeData();
            setLastError("Init complet.");
        } catch (e: any) {
            setLastError("Erreur Init: " + e.message);
        } finally {
            setIsRepairing(false);
        }
    }

    const handleTestConnection = async () => {
        setLastError("Test de connexion en cours...");
        const res = await testFirestoreConnection();
        if (res.success) {
            setLastError(`✅ Succès! ${res.count} unités lues via getDocs.`);
        } else {
            setLastError(`❌ Échec: ${res.error}`);
        }
    };


    return (
        <>
            {/* Toggle button - always visible */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: isVisible ? 'transparent' : '#2563eb',
                    color: 'white',
                    border: isVisible ? 'none' : '2px solid #1e40af',
                    padding: isVisible ? '0' : '12px 16px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    zIndex: 10000,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    boxShadow: isVisible ? 'none' : '0 4px 12px rgba(0,0,0,0.5)',
                    width: isVisible ? 'auto' : '50px',
                    height: isVisible ? 'auto' : '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
                title={isVisible ? "Masquer le diagnostic" : "Afficher le diagnostic"}
            >
                {!isVisible && '🔧'}
            </button>

            {/* Diagnostic panel */}
            {isVisible && (
                <div style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    color: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    zIndex: 9999,
                    maxWidth: '320px',
                    fontFamily: 'monospace',
                    boxShadow: '0 0 15px rgba(0,0,0,0.7)',
                    border: '1px solid #444'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #444', paddingBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontWeight: 'bold', color: '#fbbf24' }}>DIAGNOSTIC SYNC V3</h4>
                        <button
                            onClick={() => setIsVisible(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0',
                                lineHeight: '1'
                            }}
                            title="Masquer"
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ marginBottom: '4px' }}>
                        Config: <span style={{ color: configStatus.includes('MISSING') ? '#f87171' : '#9ca3af' }}>{configStatus}</span>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        Auth: <span style={{ color: isConnected ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{isConnected ? 'OK (Anonyme)' : 'NON CONNECTÉ'}</span>
                        {!isConnected && (
                            <div style={{ color: '#f87171', marginTop: '2px', fontSize: '10px' }}>
                                {authError || "En attente..."}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '10px', background: '#1f2937', padding: '5px', borderRadius: '4px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af', fontSize: '9px' }}>UNITÉS</div>
                            <div style={{ color: unitsCount === 6 ? '#4ade80' : '#f87171', fontWeight: 'bold', fontSize: '14px' }}>{unitsCount ?? '-'}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af', fontSize: '9px' }}>COMITÉS</div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{committeesCount ?? '-'}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af', fontSize: '9px' }}>SESSIONS</div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{attendanceCount ?? '-'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                        <button
                            onClick={handleForceRepair}
                            disabled={isRepairing}
                            style={{
                                backgroundColor: isRepairing ? '#4b5563' : '#2563eb',
                                color: 'white',
                                border: 'none',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: isRepairing ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '10px',
                                transition: 'background 0.2s'
                            }}
                        >
                            {isRepairing ? 'TRAITEMENT...' : '1. RÉPARER UNITÉS (Simple)'}
                        </button>
                        <button
                            onClick={handleTestConnection}
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '10px',
                            }}
                        >
                            2. TESTER CONNEXION DIRECTE
                        </button>
                        <button
                            onClick={handleInit}
                            disabled={isRepairing}
                            style={{
                                backgroundColor: isRepairing ? '#4b5563' : '#7c3aed',
                                color: 'white',
                                border: 'none',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: isRepairing ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '10px',
                                transition: 'background 0.2s'
                            }}
                        >
                            {isRepairing ? 'TRAITEMENT...' : '3. FORCE RE-SEED (Complet)'}
                        </button>
                    </div>

                    {lastError && (
                        <div style={{ color: '#fbbf24', marginTop: '8px', borderTop: '1px solid #444', paddingTop: '4px', wordBreak: 'break-all', fontSize: '10px' }}>
                            LOG: {lastError}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default SyncDebug;
