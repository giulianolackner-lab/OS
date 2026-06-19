; ============================================
; LDM-OS BOOTLOADER
; Assemblez avec: nasm -f bin bootloader.asm -o boot.bin
; ============================================
[org 0x7c00]
[bits 16]

KERNEL_OFFSET equ 0x1000

start:
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7c00
    mov [BOOT_DRIVE], dl

    mov si, MSG_BOOT
    call print_string

    ; Réinitialiser le disque
    mov ah, 0x00
    mov dl, [BOOT_DRIVE]
    int 0x13
    jc disk_error

    ; Charger le noyau
    mov bx, KERNEL_OFFSET
    mov dh, 50
    mov dl, [BOOT_DRIVE]
    mov cl, 0x02
    mov ch, 0x00
    mov ah, 0x02
    mov al, dh
    int 0x13
    jc disk_error

    mov si, MSG_OK
    call print_string

    ; Passer en mode protégé
    cli
    lgdt [gdt_descriptor]
    mov eax, cr0
    or eax, 0x1
    mov cr0, eax
    jmp CODE_SEG:init_pm

disk_error:
    mov si, MSG_ERR
    call print_string
    jmp $

print_string:
    pusha
.loop:
    lodsb
    or al, al
    jz .done
    mov ah, 0x0e
    int 0x10
    jmp .loop
.done:
    popa
    ret

[bits 32]
init_pm:
    mov ax, DATA_SEG
    mov ds, ax
    mov ss, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ebp, 0x90000
    mov esp, ebp
    call KERNEL_OFFSET
    jmp $

; GDT
gdt_start:
gdt_null:   dd 0x0
            dd 0x0
gdt_code:   dw 0xffff
            dw 0x0
            db 0x0
            db 10011010b
            db 11001111b
            db 0x0
gdt_data:   dw 0xffff
            dw 0x0
            db 0x0
            db 10010010b
            db 11001111b
            db 0x0
gdt_end:

gdt_descriptor:
    dw gdt_end - gdt_start - 1
    dd gdt_start

CODE_SEG equ gdt_code - gdt_start
DATA_SEG equ gdt_data - gdt_start

BOOT_DRIVE db 0
MSG_BOOT db 'LDM-OS Boot v1.0', 13, 10, 'Chargement...', 13, 10, 0
MSG_OK db 'OK!', 13, 10, 0
MSG_ERR db 'Erreur disque!', 13, 10, 0

times 510-($-$$) db 0
dw 0xaa55