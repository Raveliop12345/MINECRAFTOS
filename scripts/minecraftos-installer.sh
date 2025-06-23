#!/bin/bash
set -euo pipefail

# --- MinecraftOS Installateur Live ---
# Ce script doit être lancé UNIQUEMENT depuis le live ISO, jamais pendant la création de l'ISO !

# Détection automatique EFI/BIOS
if [ -d /sys/firmware/efi ]; then
  NEEDS_EFI=1
  echo "[BOT] Détection : Système EFI (UEFI) détecté."
else
  NEEDS_EFI=0
  echo "[BOT] Détection : Système BIOS (legacy) détecté."
fi

# Demande interactive du disque cible
if [ -z "${DISK:-}" ]; then
  echo "[BOT] Disques disponibles sur le système :"
  lsblk -d -n -p -o NAME,SIZE,MODEL
  read -rp "[BOT] Entrez le chemin du disque cible pour l'installation (ex: /dev/sda) : " DISK
fi

echo "[BOT] Partitionnement et montage..."
if [ "$NEEDS_EFI" = "1" ]; then
    parted -s "$DISK" mkpart primary fat32 1MiB 513MiB
    parted -s "$DISK" set 1 esp on
    parted -s "$DISK" mkpart primary ext4 513MiB 100%
  else
    parted -s "$DISK" mkpart primary ext4 1MiB 513MiB
    parted -s "$DISK" mkpart primary ext4 513MiB 100%
  fi
sleep 2
if [ "$NEEDS_EFI" = "1" ]; then
    NEW_BOOT=$(lsblk -lnp "$DISK" | grep "512M" | awk '{print $1}')
    NEW_ROOT=$(lsblk -lnp "$DISK" | grep -v "512M" | tail -n1 | awk '{print $1}')
    mkfs.fat -F32 "$NEW_BOOT"
    mkfs.ext4 -F "$NEW_ROOT"
    mount "$NEW_ROOT" /mnt
    mkdir -p /mnt/boot/efi
    mount "$NEW_BOOT" /mnt/boot/efi
  else
    NEW_BOOT=$(lsblk -lnp "$DISK" | grep "512M" | awk '{print $1}')
    NEW_ROOT=$(lsblk -lnp "$DISK" | grep -v "512M" | tail -n1 | awk '{print $1}')
    mkfs.ext4 -F "$NEW_BOOT"
    mkfs.ext4 -F "$NEW_ROOT"
    mount "$NEW_ROOT" /mnt
    mkdir -p /mnt/boot
    mount "$NEW_BOOT" /mnt/boot
  fi
echo "[BOT] Partition $NEW_BOOT montée sur /boot, $NEW_ROOT montée sur /"

# Ici, ajouter la copie du système, l'installation du bootloader, etc.
echo "[BOT] Installation système à compléter ici..."
# ...
