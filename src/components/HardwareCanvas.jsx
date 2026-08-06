import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import hardwareSketch from '../simulation/hardwareSketch';

const HardwareCanvas = ({ addLog, syncMram }) => {
    const canvasRef = useRef();
    const p5Instance = useRef(null);

    useEffect(() => {
        // Pass syncMram as the third argument to the sketch
        p5Instance.current = new p5((p) => hardwareSketch(p, addLog, syncMram), canvasRef.current);
        return () => p5Instance.current.remove();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div ref={canvasRef} style={{ border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }} />

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => p5Instance.current?.startBoot()} style={{ width: '250px' }}>
                    [ POWER CYCLE / BOOT ]
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => p5Instance.current?.triggerFault(0, 'SEU')}>Inject I2C (SEU)</button>
                    <button onClick={() => p5Instance.current?.triggerFault(1, 'SEU')}>Inject SPI (SEU)</button>
                    <button onClick={() => p5Instance.current?.triggerFault(2, 'SEU')}>Inject UART (SEU)</button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ borderColor: '#ff0000', color: '#ff0000' }} onClick={() => p5Instance.current?.triggerFault(0, 'SEL')}>Inject I2C (SEL)</button>
                    <button style={{ borderColor: '#ff0000', color: '#ff0000' }} onClick={() => p5Instance.current?.triggerFault(1, 'SEL')}>Inject SPI (SEL)</button>
                    <button style={{ borderColor: '#ff0000', color: '#ff0000' }} onClick={() => p5Instance.current?.triggerFault(2, 'SEL')}>Inject UART (SEL)</button>
                </div>
            </div>
        </div>
    );
};

export default HardwareCanvas;