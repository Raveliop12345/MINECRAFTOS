#!/bin/bash

# Script de Construction pour MinecraftOS
# Ce script crée un système Arch Linux de base avec une interface utilisateur web personnalisée.

# Quitter en cas d'erreur
set -e

# --- Configuration ---
# Le répertoire où le système de fichiers racine final sera construit.
ROOTFS_DIR="OS FINAL/rootfs"
# Le répertoire contenant le code source de l'interface utilisateur.
UI_DIR="model"
# Le nom d'utilisateur pour la session live.
LIVE_USER="player"
# Le mot de passe pour l'utilisateur live.
LIVE_PASS="password"


# --- 1. Préparation et Nettoyage ---
echo "--- [1/7] Nettoyage de l'environnement de construction précédent ---"
# Démonter les systèmes de fichiers précédemment montés dans le chroot, en ignorant les erreurs s'ils ne sont pas montés.
sudo umount "$ROOTFS_DIR/dev" 2>/dev/null || true
sudo umount "$ROOTFS_DIR/proc" 2>/dev/null || true
sudo umount "$ROOTFS_DIR/sys" 2>/dev/null || true
# Supprimer l'ancien répertoire rootfs et le recréer.
if [ -d "$ROOTFS_DIR" ]; then
    sudo rm -rf "$ROOTFS_DIR"
fi
mkdir -p "$ROOTFS_DIR"
echo "Nettoyage terminé."


# --- 2. Construction de l'Interface Utilisateur ---
echo "--- [2/7] Construction de l'Interface Utilisateur ---"
# Naviguer vers le répertoire de l'UI, installer les dépendances et construire les fichiers statiques.
(cd "$UI_DIR" && npm install && npm run build)
echo "Construction de l'UI terminée. Les fichiers se trouvent dans $UI_DIR/dist/"


# --- 3. Bootstrap du Système de Base ---
echo "--- [3/7] Bootstrap du système de base Arch Linux avec pacstrap ---"
# Installer le système de base, le noyau et les firmwares essentiels dans le répertoire rootfs.
# -K initialise un trousseau de clés pacman vide dans le chroot.
sudo pacstrap -K "$ROOTFS_DIR" base linux linux-firmware sudo
echo "Système de base installé."


# --- 4. Génération de fstab ---
echo "--- [4/7] Génération de fstab pour le nouveau système ---"
# Générer un fichier fstab pour le nouveau système.
# -U utilise les UUIDs pour les périphériques de bloc.
sudo genfstab -U "$ROOTFS_DIR" | sudo tee "$ROOTFS_DIR/etc/fstab" > /dev/null
echo "fstab généré."


# --- 5. Copie des Ressources Système dans le Chroot ---
echo "--- [5/7] Copie des ressources système dans l'environnement chroot ---"
sudo cp -r "$UI_DIR/dist" "$ROOTFS_DIR/tmp/ui_build"
echo "UI copiée dans $ROOTFS_DIR/tmp/ui_build"
sudo cp -r scripts "$ROOTFS_DIR/tmp/scripts"
echo "Scripts copiés dans $ROOTFS_DIR/tmp/scripts"
sudo cp -r Minecraft-Icons "$ROOTFS_DIR/tmp/Minecraft-Icons"
echo "Icônes copiées dans $ROOTFS_DIR/tmp/Minecraft-Icons"
# Copier les ressources publiques de l'UI (pour les icônes du store)
sudo cp -r "$UI_DIR/public" "$ROOTFS_DIR/tmp/ui_public_assets"
echo "Ressources de l'UI copiées dans $ROOTFS_DIR/tmp/ui_public_assets"


# --- 6. Chroot et Configuration du Système ---
echo "--- [6/7] Entrée dans le chroot et configuration du système ---"
# Exécuter un script à l'intérieur du nouveau système pour le configurer.
# 'EOF' est entre guillemets pour empêcher l'expansion des variables par l'hôte.
sudo arch-chroot "$ROOTFS_DIR" /bin/bash -e <<'EOF'

# --- Configuration à l'intérieur du chroot ---
LIVE_USER="player"
LIVE_PASS="password"

# Définir le nom d'hôte
echo "MinecraftOS" > /etc/hostname

# Définir le fuseau horaire
ln -sf /usr/share/zoneinfo/UTC /etc/localtime

# Définir la locale
echo "fr_FR.UTF-8 UTF-8" > /etc/locale.gen
locale-gen
echo "LANG=fr_FR.UTF-8" > /etc/locale.conf

# Installer les paquets nécessaires pour un environnement de bureau fonctionnel
echo "Installation de l'environnement de bureau et des dépendances..."
pacman -Syu --noconfirm --needed xorg-server xorg-xinit openbox chromium ttf-dejavu \
lxterminal thunar \
python-pip python-requests python-tkinter python-pillow git base-devel

# Installer yay (AUR Helper)
echo "Installation de l'AUR Helper (yay)..."
cd /tmp
git clone https://aur.archlinux.org/yay.git
chown -R $LIVE_USER:$LIVE_USER yay
cd yay
su - $LIVE_USER -c "makepkg -si --noconfirm"
cd /tmp
rm -rf yay

# Installer les dépendances Python via pip
echo "Installation des paquets Python depuis pip..."
pip install customtkinter


# Créer l'utilisateur live
echo "Création de l'utilisateur : $LIVE_USER"
useradd -m -G wheel -s /bin/bash "$LIVE_USER"
echo "$LIVE_USER:$LIVE_PASS" | chpasswd

# Configurer sudo pour autoriser le groupe wheel à exécuter des commandes sans mot de passe
echo "Configuration de sudo..."
echo "%wheel ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Configurer l'autologin pour tty1
echo "Configuration de l'autologin..."
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf <<EOCONF
[Service]
ExecStart=
ExecStart=-/usr/bin/agetty --autologin $LIVE_USER --noclear %I \$TERM
EOCONF

# Configurer le démarrage automatique de la session X lors de la connexion
echo "Configuration du démarrage automatique de la session X..."
BASH_PROFILE="/home/$LIVE_USER/.bash_profile"
echo 'if [ -z "${DISPLAY}" ] && [ "$(tty)" = "/dev/tty1" ]; then startx; fi' > "$BASH_PROFILE"
chown "$LIVE_USER:$LIVE_USER" "$BASH_PROFILE"

# Mettre en place l'application UI
echo "Mise en place de l'application UI..."
APP_DIR="/home/$LIVE_USER/app"
mkdir -p "$APP_DIR"
mv /tmp/ui_build/* "$APP_DIR/"
chown -R "$LIVE_USER:$LIVE_USER" "$APP_DIR"

# Mettre en place les scripts et icônes système
echo "Mise en place des scripts et icônes..."
mkdir -p /usr/local/bin/minecraftos_scripts
mv /tmp/scripts/* /usr/local/bin/minecraftos_scripts/
chmod +x /usr/local/bin/minecraftos_scripts/*.py

mkdir -p /usr/share/icons/minecraftos
mv /tmp/Minecraft-Icons/* /usr/share/icons/minecraftos/

# Préparer les icônes pour le store
mkdir -p /usr/share/minecraftos/store
mv /tmp/ui_public_assets/*.png /usr/share/minecraftos/store/

# Créer le fichier de configuration pour le bot
echo "Création de la configuration pour l'assistant IA..."
CONFIG_DIR="/home/$LIVE_USER/.config/minecraftos"
mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_DIR/bot_config.json" <<'EOCONFIG'
{
    "provider": "gemini",
    "api_key": "VOTRE_CLE_API_GEMINI_ICI",
    "api_url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    "model": "gemini-pro"
}
EOCONFIG
chown -R "$LIVE_USER:$LIVE_USER" "$CONFIG_DIR"

# Créer le service systemd pour le companion
echo "Création du service pour le companion..."
cat > /etc/systemd/system/minecraftos-companion.service <<'EOSERVICE'
[Unit]
Description=MinecraftOS Companion Backend
After=network.target

[Service]
User=player
ExecStart=/usr/bin/python3 /usr/local/bin/minecraftos_scripts/minecraftos-companion.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOSERVICE

systemctl enable minecraftos-companion.service

# Configurer Openbox pour lancer l'UI en mode kiosque
echo "Configuration d'Openbox..."
OPENBOX_CONFIG_DIR="/home/$LIVE_USER/.config/openbox"
mkdir -p "$OPENBOX_CONFIG_DIR"
cat > "$OPENBOX_CONFIG_DIR/autostart" <<'EOX'
# Désactiver l'économiseur d'écran et la gestion de l'alimentation
xset s off -dpms
# Lancer l'UI en mode plein écran, type kiosque
chromium --kiosk --no-first-run --disable-features=TranslateUI --app="file:///home/player/app/index.html" &
EOX
chown -R "$LIVE_USER:$LIVE_USER" "/home/$LIVE_USER/.config"

# Configurer .xinitrc pour démarrer Openbox
echo "Configuration de .xinitrc..."
XINITRC_FILE="/home/$LIVE_USER/.xinitrc"
echo "exec openbox-session" > "$XINITRC_FILE"
chown "$LIVE_USER:$LIVE_USER" "$XINITRC_FILE"
chmod +x "$XINITRC_FILE"

echo "Configuration du chroot terminée."
EOF


# --- 7. Nettoyage Final ---
echo "--- [7/7] Nettoyage final ---"
# Les fichiers de l'UI ont été déplacés, il suffit donc de supprimer le répertoire temporaire.
sudo rm -rf "$ROOTFS_DIR/tmp/ui_build"
echo "Processus de construction terminé avec succès !"
echo "Le système de fichiers racine est prêt dans : $ROOTFS_DIR"
echo "La prochaine étape consiste à créer une image ISO amorçable à partir de ce rootfs."
