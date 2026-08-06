import React, { useEffect, useRef } from 'react';

const MatrixTerminal = ({ logs }) => {
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div style={styles.container}>
            <div style={styles.scanline}></div>
            {logs.map((log, index) => (
                <div key={index} style={styles.logLine}>
                    {log}
                </div>
            ))}
            <div ref={terminalEndRef} />
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#050505',
        color: '#00ff41',
        fontFamily: '"Fira Code", "Courier New", Courier, monospace',
        fontSize: '0.9rem',
        height: '100%',
        overflowY: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
        borderLeft: '2px solid #222',
        position: 'relative',
    },
    logLine: {
        marginBottom: '8px',
        textShadow: '0px 0px 5px rgba(0, 255, 65, 0.5)',
        wordWrap: 'break-word',
    },
    scanline: {
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
        backgroundSize: '100% 4px',
        pointerEvents: 'none',
    }
};

export default MatrixTerminal;