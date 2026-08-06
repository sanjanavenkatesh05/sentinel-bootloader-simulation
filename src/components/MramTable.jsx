import React from 'react';

const MramTable = ({ mramState }) => {
    return (
        <div style={styles.container}>
            <div style={styles.header}>[ MRAM REGISTERS : 0x08040000 ]</div>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.tr}>
                        <th style={styles.th}>MEM_ADDR</th>
                        <th style={styles.th}>MODULE</th>
                        <th style={styles.th}>STRIKES</th>
                        <th style={styles.th}>PMIC_GATE</th>
                    </tr>
                </thead>
                <tbody>
                    {mramState.map((reg) => (
                        <tr key={reg.id} style={{ ...styles.tr, color: reg.skip ? '#ff0000' : '#00ff41' }}>
                            <td style={styles.td}>0x0{reg.id}A</td>
                            <td style={styles.td}>{reg.name.toUpperCase()}</td>
                            <td style={styles.td}>{reg.strikes} / 3</td>
                            <td style={styles.td}>{reg.skip ? 'OPEN (CUT)' : 'CLOSED (OK)'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#050505',
        color: '#00ff41',
        fontFamily: '"Fira Code", monospace',
        padding: '15px',
        borderLeft: '2px solid #222',
        borderBottom: '2px solid #222',
        height: '35%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        position: 'relative'
    },
    header: {
        fontSize: '0.9rem',
        color: '#ccc',
        marginBottom: '10px',
        borderBottom: '1px dashed #444',
        paddingBottom: '5px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.85rem'
    },
    th: {
        textAlign: 'left',
        padding: '5px',
        color: '#888',
        fontWeight: 'normal'
    },
    td: {
        padding: '8px 5px',
        borderBottom: '1px solid #111'
    },
    tr: {
        transition: 'color 0.3s'
    }
};

export default MramTable;