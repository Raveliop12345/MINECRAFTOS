#!/bin/bash
# Script de partitionnement interactif MinecraftOS (à lancer lors de l'installation)
# Ce script propose de remplacer une partition par découpage automatique (512M pour /boot ou /boot/efi, le reste pour /)

set -e

# Détection UEFI/BIOS
if [ -d /sys/firmware/efi ]; then
  echo "[BOT] UEFI détecté"
  NEEDS_EFI=1
else
  echo "[BOT] Mode BIOS détecté"
  NEEDS_EFI=0
fi

# Choix du type de partitionnement
PARTMODE=$(dialog --stdout --menu "Type de partitionnement" 15 60 3 1 "Classique (ext4)" 2 "LVM" 3 "Btrfs (avec sous-volumes)")

replace_and_split_partition() {
  select_partition() {
    local prompt="$1"
    local var="$2"
    local options=$(lsblk -lnp -o NAME,SIZE,TYPE | awk '$3=="part"{print $1" "$2}')
    local menu=""
    while read -r line; do
      dev=$(echo $line | awk '{print $1}')
      size=$(echo $line | awk '{print $2}')
      menu+="$dev $size ";
    done <<< "$options"
    PART=$(dialog --stdout --menu "$prompt" 20 70 10 $menu)
    eval $var="$PART"
  }

  select_partition "Choisissez la partition à remplacer (sera découpée pour /boot et /)" REPLACE_PART
  dialog --yesno "Voulez-vous vraiment découper et formater $REPLACE_PART ?\n\nCETTE OPÉRATION EFFACERA TOUTES LES DONNÉES DE CETTE PARTITION !" 10 60 || exit 1
  DISK=$(lsblk -no PKNAME "$REPLACE_PART" | head -n1)
  DISK="/dev/$DISK"
  PARTNUM=$(lsblk -lnp "$DISK" | grep "$REPLACE_PART" | awk '{print $1}' | grep -o '[0-9]*$')
  parted -s "$DISK" rm "$PARTNUM"
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
}

if [[ "$PARTMODE" == "2" ]]; then
  echo "[BOT] Partitionnement LVM sélectionné."
  replace_and_split_partition
  pvcreate "$NEW_ROOT"
  vgcreate vg_mcos "$NEW_ROOT"
  lvcreate -L 20G -n root vg_mcos
  lvcreate -L 4G -n swap vg_mcos
  lvcreate -l 100%FREE -n home vg_mcos
  mkfs.ext4 /dev/vg_mcos/root
  mkfs.ext4 /dev/vg_mcos/home
  mkswap /dev/vg_mcos/swap
  mount /dev/vg_mcos/root /mnt
  mkdir -p /mnt/home && mount /dev/vg_mcos/home /mnt/home
  swapon /dev/vg_mcos/swap
elif [[ "$PARTMODE" == "3" ]]; then
  echo "[BOT] Partitionnement Btrfs sélectionné."
  replace_and_split_partition
  mkfs.btrfs -f "$NEW_ROOT"
  mount "$NEW_ROOT" /mnt
  btrfs subvolume create /mnt/@
  btrfs subvolume create /mnt/@home
  btrfs subvolume create /mnt/@var
  umount /mnt
  mount -o subvol=@ "$NEW_ROOT" /mnt
  mkdir -p /mnt/home && mount -o subvol=@home "$NEW_ROOT" /mnt/home
  mkdir -p /mnt/var && mount -o subvol=@var "$NEW_ROOT" /mnt/var
else
  replace_and_split_partition
  # L'utilisateur peut ajouter /home, swap, etc. via d'autres partitions si besoin
fi

echo "[BOT] Partitionnement et montage terminés !"
