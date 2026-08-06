#ifndef HAL_H
#define HAL_H

#include <stdint.h>
#include <stdbool.h>

// 1. Core Hardware
void system_clock_init(void);
void watchdog_init(void);
void watchdog_pet(void);
bool was_reset_caused_by_watchdog(void);
void clear_reset_flags(void);

// 2. Sentinel MRAM / PMIC Interfaces
typedef struct {
    uint8_t peripheral_id;
    uint8_t strike_count;
    bool skip_flag;
    bool last_boot_success; // Added this to fix the compiler error!
} StateVector;

void mram_init(void);

// Updated functions to handle the full array of peripherals
void mram_read_state_vector(StateVector* vector, int count);
void mram_write_state_vector(StateVector* vector, int count);

// Track which peripheral is actively initializing
int mram_read_active_peripheral(void);
void mram_write_active_peripheral(int peripheral_id);

void pmic_power_gate(uint8_t peripheral_id);

// 3. Execution Handoff
void jump_to_os(uint32_t start_address);

#endif // HAL_H
