import React, { useState } from 'react';
import MatrixTerminal from './MatrixTerminal';
import HardwareCanvas from './HardwareCanvas';
import MramTable from './MramTable';

const Dashboard = () => {
    const [logs, setLogs] = useState([
        "[0.000s] SYSTEM POWER ON",
        "[0.002s] VCC stable. Ready for Sentinel Boot sequence."
    ]);

    // React now tracks the MRAM state to render the table
    const [mramState, setMramState] = useState([]);

    const addLog = (message) => {
        const timestamp = (performance.now() / 1000).toFixed(3);
        setLogs((prev) => [...prev, `[${timestamp}s] ${message}`]);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>

            {/* Left Pane (60%): Hardware Canvas */}
            <div style={{ flex: 6, display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <h2 style={{ margin: '0 0 20px 0', color: '#ccc' }}>Sentinel Bootloader : Hardware Telemetry</h2>
                {/* Pass down the state setter so p5 can sync with React */}
                <HardwareCanvas addLog={addLog} syncMram={setMramState} />
            </div>

            {/* Right Pane (40%): Stacked MRAM and Logs */}
            <div style={{ flex: 4, display: 'flex', flexDirection: 'column' }}>
                <MramTable mramState={mramState} />

                {/* Wrap terminal in a div taking up the remaining 65% of the height */}
                <div style={{ height: '65%' }}>
                    <MatrixTerminal logs={logs} />
                </div>
            </div>

        </div>
    );
};

export default Dashboard;