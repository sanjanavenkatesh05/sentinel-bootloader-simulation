#include "hal.h"
#include <libopencm3/stm32/rcc.h>
#include <libopencm3/stm32/iwdg.h>
#include <libopencm3/stm32/gpio.h>
#include <libopencm3/stm32/i2c.h>
#include <libopencm3/cm3/scb.h>

// --- Core Hardware ---
void system_clock_init(void) {
    rcc_clock_setup_pll(&rcc_hse_8mhz_3v3[RCC_CLOCK_3V3_168MHZ]);
    rcc_periph_clock_enable(RCC_I2C1);
    rcc_periph_clock_enable(RCC_GPIOB);
}

void watchdog_init(void) {
    iwdg_set_period_ms(1000); 
    iwdg_start();
}

void watchdog_pet(void) {
    iwdg_reset();
}

// Check if Independent Watchdog Flag (IWDGRSTF) was set
bool was_reset_caused_by_watchdog(void) {
    return (RCC_CSR & RCC_CSR_IWDGRSTF) != 0;
}

// Clear reset flags after triage
void clear_reset_flags(void) {
    RCC_CSR |= RCC_CSR_RMVF;
}

// --- MRAM & PMIC Interfaces ---
void mram_init(void) {
    gpio_mode_setup(GPIOB, GPIO_MODE_AF, GPIO_PUPD_NONE, GPIO6 | GPIO7);
    gpio_set_af(GPIOB, GPIO_AF4, GPIO6 | GPIO7);
    gpio_set_output_options(GPIOB, GPIO_OTYPE_OD, GPIO_OSPEED_50MHZ, GPIO6 | GPIO7);

    i2c_peripheral_disable(I2C1);
    
    // FIX: Using 42 directly instead of the deprecated macro
    i2c_set_clock_frequency(I2C1, 42); 
    i2c_set_standard_mode(I2C1); 
    i2c_peripheral_enable(I2C1);
}

// Mock: Fill with clean states for testing
void mram_read_state_vector(StateVector* vector, int count) {
    for (int i = 0; i < count; i++) {
        vector[i].peripheral_id = i;
        vector[i].strike_count = 0;
        vector[i].skip_flag = false;
        vector[i].last_boot_success = true;
    }
}

// Mock: Future I2C write logic
void mram_write_state_vector(StateVector* vector, int count) {
    (void)vector;
    (void)count;
}

// Mock: Return -1 (none active) for testing
int mram_read_active_peripheral(void) {
    return -1; 
}

// Mock: Future I2C write logic
void mram_write_active_peripheral(int peripheral_id) {
    (void)peripheral_id;
}

void pmic_power_gate(uint8_t peripheral_id) {
    (void)peripheral_id;
}

// --- Execution Handoff ---
void jump_to_os(uint32_t start_address) {
    SCB_VTOR = start_address;

    uint32_t *app_vector_table = (uint32_t *)start_address;
    uint32_t app_stack_pointer = app_vector_table[0];
    uint32_t app_entry_point = app_vector_table[1];

    // FIX: Changed "g" to "r" so GCC knows it MUST use a CPU register
    __asm__ volatile("msr msp, %0" ::"r"(app_stack_pointer));

    void (*app_start)(void) = (void (*)(void))app_entry_point;
    app_start();
}
