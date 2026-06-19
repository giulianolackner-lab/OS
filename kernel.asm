; ============================================
; LDM-OS KERNEL - Mode protégé 32 bits
; Assemblez avec: nasm -f bin kernel.asm -o kernel.bin
; ============================================
[bits 32]

VIDEO_MEM equ 0xb8000
WHITE_ON_BLACK equ 0x0f
WHITE_ON_BLUE equ 0x1f
MAX_CMD equ 256

start_kernel:
    ; Effacer l'écran
    call clear_screen
    
    ; Message de démarrage
    mov esi, MSG_KERNEL
    mov edi, VIDEO_MEM
    add edi, 160
    mov ah, WHITE_ON_BLUE
    call print_string
    
    ; Prompt
    mov esi, MSG_PROMPT
    mov edi, VIDEO_MEM
    add edi, 480
    mov ah, WHITE_ON_BLACK
    call print_string
    
    ; Initialiser buffer commande
    mov edi, cmd_buffer
    mov ecx, MAX_CMD
    xor eax, eax
    rep stosb
    
    mov dword [cmd_pos], 0

; Boucle principale
main_loop:
    call check_keyboard
    jmp main_loop

; Vérifier le clavier
check_keyboard:
    in al, 0x64
    test al, 0x01
    jz .no_key
    
    in al, 0x60
    
    cmp al, 0x1c        ; Enter
    je execute_cmd
    cmp al, 0x0e        ; Backspace
    je handle_backspace
    
    ; Afficher caractère
    call print_char
.no_key:
    ret

; Exécuter commande
execute_cmd:
    ; Nouvelle ligne
    mov byte [VIDEO_MEM + 1440], 13
    mov byte [VIDEO_MEM + 1442], 10
    
    ; Vérifier commandes
    mov esi, cmd_buffer
    
    ; help
    mov edi, CMD_HELP
    call strcmp
    cmp eax, 1
    je cmd_do_help
    
    ; clear
    mov edi, CMD_CLEAR
    call strcmp
    cmp eax, 1
    je cmd_do_clear
    
    ; info
    mov edi, CMD_INFO
    call strcmp
    cmp eax, 1
    je cmd_do_info
    
    ; halt
    mov edi, CMD_HALT
    call strcmp
    cmp eax, 1
    je cmd_do_halt
    
    ; reboot
    mov edi, CMD_REBOOT
    call strcmp
    cmp eax, 1
    je cmd_do_reboot

    ; Commande inconnue
    mov esi, MSG_UNKNOWN
    mov edi, VIDEO_MEM
    add edi, 1920
    mov ah, 0x0c
    call print_string
    
    ; Réinitialiser prompt
    call reset_prompt
    ret

; Commandes
cmd_do_help:
    mov esi, MSG_HELP
    mov edi, VIDEO_MEM
    add edi, 1920
    mov ah, WHITE_ON_BLACK
    call print_string
    call reset_prompt
    ret

cmd_do_clear:
    call clear_screen
    call reset_prompt
    ret

cmd_do_info:
    mov esi, MSG_INFO
    mov edi, VIDEO_MEM
    add edi, 1920
    mov ah, WHITE_ON_BLACK
    call print_string
    call reset_prompt
    ret

cmd_do_halt:
    mov esi, MSG_SHUTDOWN
    mov edi, VIDEO_MEM
    add edi, 1920
    mov ah, 0xcf
    call print_string
    cli
    hlt
    jmp $

cmd_do_reboot:
    lidt [idtr_zero]
    int 0x0

; Réinitialiser le prompt
reset_prompt:
    mov edi, cmd_buffer
    mov ecx, MAX_CMD
    xor eax, eax
    rep stosb
    mov dword [cmd_pos], 0
    
    mov esi, MSG_PROMPT
    mov edi, VIDEO_MEM
    add edi, 2240
    mov ah, WHITE_ON_BLACK
    call print_string
    ret

; Fonctions
clear_screen:
    pusha
    mov edi, VIDEO_MEM
    mov ecx, 2000
    mov ax, 0x0720
    rep stosw
    popa
    ret

print_string:
    pusha
.loop:
    lodsb
    cmp al, 0
    je .done
    mov [edi], ax
    add edi, 2
    jmp .loop
.done:
    popa
    ret

strcmp:
    push ebx
.loop:
    mov al, [esi]
    mov bl, [edi]
    cmp al, bl
    jne .no
    cmp al, 0
    je .yes
    inc esi
    inc edi
    jmp .loop
.yes:
    mov eax, 1
    pop ebx
    ret
.no:
    mov eax, 0
    pop ebx
    ret

print_char:
    ; À implémenter
    ret

handle_backspace:
    ; À implémenter
    ret

; Données
MSG_KERNEL db 'LDM-OS Kernel v1.0 - Systeme operationnel 32 bits', 0
MSG_PROMPT db 'root@LDM-OS:~# ', 0
MSG_HELP db 'Commandes: help, clear, info, halt, reboot', 0
MSG_INFO db 'LDM-OS | Kernel 1.0 | Architecture: x86 32-bit | Mode protege', 0
MSG_UNKNOWN db 'Commande inconnue! Tapez help.', 0
MSG_SHUTDOWN db 'Systeme arrete.', 0

CMD_HELP db 'help', 0
CMD_CLEAR db 'clear', 0
CMD_INFO db 'info', 0
CMD_HALT db 'halt', 0
CMD_REBOOT db 'reboot', 0

cmd_buffer times MAX_CMD db 0
cmd_pos dd 0

idtr_zero:
    dw 0
    dd 0

; Padding
times 32768 - ($ - $$) db 0