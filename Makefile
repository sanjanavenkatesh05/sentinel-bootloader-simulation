# --- Project Details ---
PROJECT = sentinel-bootloader
CFILES = src/main.c src/hal_stm32.c
OBJS = $(CFILES:.c=.o)

OPENCM3_DIR = libopencm3
LDSCRIPT = sentinel.ld

# --- Toolchain Definitions ---
CC = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy

# --- Compiler & Linker Flags for STM32F405 ---
# -mcpu and -mthumb tell GCC we are compiling for the Cortex-M4 architecture
CFLAGS = -Os -g -Wall -Wextra -I$(OPENCM3_DIR)/include -fno-common -mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16 -DSTM32F4
LDFLAGS = -L$(OPENCM3_DIR)/lib -lopencm3_stm32f4 -T$(LDSCRIPT) -nostartfiles -Wl,--gc-sections -mthumb -mcpu=cortex-m4 -mfloat-abi=hard -mfpu=fpv4-sp-d16

# --- Build Rules ---
all: $(PROJECT).elf $(PROJECT).bin

# Rule to build the raw binary file for flashing
%.bin: %.elf
	$(OBJCOPY) -O binary $< $@

# Rule to link the object files into the ELF executable
$(PROJECT).elf: $(OBJS)
	$(CC) $(OBJS) $(LDFLAGS) -o $@

# Rule to compile C files into object files
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Rule to clean up compiled files
clean:
	rm -f $(OBJS) $(PROJECT).elf $(PROJECT).bin
