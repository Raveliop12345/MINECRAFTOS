#!/bin/bash
# Ce script copie les icônes Minecraft du pack mcicons dans l'ISO et adapte les raccourcis .desktop

ICON_SRC="$(dirname "$0")/../mcicons/public/icons"
ICON_DST="../airootfs/usr/share/icons/minecraftos"
mkdir -p "$ICON_DST"

# Liste des icônes à utiliser pour les applis principales
# (adapter ici selon les besoins du bureau/dock)
declare -A ICON_MAP=(
  [minecraftos-store]="minecraft_chest.png"
  [HMCL]="minecraft_crafting_table.png"
  [TLauncher]="minecraft_furnace.png"
  [Terminal]="minecraft_command_block.png"
  [AIbot]="minecraft_emerald.png"
)

for app in "${!ICON_MAP[@]}"; do
  src="$ICON_SRC/${ICON_MAP[$app]}"
  dst="$ICON_DST/${ICON_MAP[$app]}"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
  fi
  # Prépare le .desktop pour chaque appli (exemple générique)
  cat <<EOF > ../airootfs/usr/share/applications/${app}.desktop
[Desktop Entry]
Type=Application
Name=$app
Exec=$app
Icon=/usr/share/icons/minecraftos/${ICON_MAP[$app]}
Terminal=false
Categories=Game;Utility;
EOF
done

# Pour le store, s'assurer que le raccourci est sur le bureau par défaut
mkdir -p ../airootfs/etc/skel/Desktop
cp ../airootfs/usr/share/applications/minecraftos-store.desktop ../airootfs/etc/skel/Desktop/
