#include "hal.h"
#include <stddef.h>

#define OS_START_ADDRESS  0x08008000
#define STRIKE_THRESHOLD  3
#define NUM_PERIPHERALS   3

// Define the system peripherals as tracked in the paper
typedef enum {
    PERIPH_I2C_SENSORS = 0,
    PERIPH_SPI_COMM    = 1,
    PERIPH_UART_LOG    = 2
} PeripheralID;

// Define peripheral functions matching the paper's abstraction
typedef struct {
    PeripheralID id;
    bool (*init_func)(void);
} PeripheralDevice;

// Mock initialization routines for your physical hardware
bool init_i2c_sensors(void) { return true; }
bool init_spi_comm(void)    { return true; }
bool init_uart_log(void)    { return true; }

// System peripheral registry array
static PeripheralDevice system_peripherals[NUM_PERIPHERALS] = {
    { PERIPH_I2C_SENSORS, init_i2c_sensors },
    { PERIPH_SPI_COMM,    init_spi_comm },
    { PERIPH_UART_LOG,    init_uart_log }
};

int main(void) {
    // 1. Initialize bare-metal clocks and I2C bus for MRAM/PMIC
    system_clock_init();
    mram_init();

    // Read full system state vector array from persistent MRAM
    StateVector state_vector[NUM_PERIPHERALS];
    mram_read_state_vector(state_vector, NUM_PERIPHERALS);

    // =========================================================
    // ALGORITHM 2: FAULT TRIAGE AND STRIKE COUNTER LOGIC
    // =========================================================
    
    // Check if the hardware Watchdog Timer triggered the system reset
    if (was_reset_caused_by_watchdog()) {
        // Read the last attempted peripheral ID saved to MRAM before the crash
        int failed_id = mram_read_active_peripheral();

        if (failed_id >= 0 && failed_id < NUM_PERIPHERALS) {
            // Increment the strike count for the culprit peripheral
            state_vector[failed_id].strike_count++;

            // Multi-strike threshold check
            if (state_vector[failed_id].strike_count >= STRIKE_THRESHOLD) {
                // Classify as permanent failure (SEL)
                state_vector[failed_id].skip_flag = true;
                
                // Command PMIC to power-gate the latched-up domain
                pmic_power_gate(failed_id);
            }
            // Save updated triage state to MRAM
            mram_write_state_vector(state_vector, NUM_PERIPHERALS);
        }
        
        // Clear hardware reset flags
        clear_reset_flags();
    }

    // =========================================================
    // ALGORITHM 1: MAIN SENTINEL BOOT EXECUTION SEQUENCE
    // =========================================================
    
    // Arm the hardware Watchdog Timer before initializing peripherals
    watchdog_init();

    for (int i = 0; i < NUM_PERIPHERALS; i++) {
        PeripheralDevice dev = system_peripherals[i];

        // Check if peripheral is flagged for permanent bypass
        if (state_vector[dev.id].skip_flag) {
            continue; // Bypass initialization
        }

        // Write the active peripheral ID to MRAM BEFORE attempting init
        // If a hard latch-up occurs here, the MCU freezes, WDT fires, and on reboot
        // Algorithm 2 reads this ID as the culprit.
        mram_write_active_peripheral(dev.id);

        // Attempt hardware initialization
        if (dev.init_func != NULL) {
            dev.init_func();
        }

        // If init succeeded without freezing, mark last boot success
        state_vector[dev.id].last_boot_success = true;
        
        // Pet the watchdog during healthy loop progression
        watchdog_pet();
    }

    // Mark active peripheral ID as safe/none (-1)
    mram_write_active_peripheral(-1);
    
    // Save state vector to MRAM
    mram_write_state_vector(state_vector, NUM_PERIPHERALS);

    // =========================================================
    // SAFE SYSTEM HANDOFF
    // =========================================================
    jump_to_os(OS_START_ADDRESS);

    return 0;
}
