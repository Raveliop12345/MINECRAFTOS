#!/usr/bin/env python3
# MinecraftOS Store - Prototype Marketplace façon Minecraft Bedrock
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import os, subprocess, json

# --- Apparence Minecraft ---
BG_COLOR = "#2d2d2d"
CARD_BG = "#3c3c3c"
BTN_COLOR = "#4caf50"
FONT = ("Minecraftia", 16)

# --- Contenu du store (exemple, à enrichir) ---
STORE_CONTENT = [
    {"name": "HMCL Launcher", "desc": "Launcher Minecraft open source.", "icon": "hmcl.png", "cmd": "java -jar /usr/local/bin/HMCL.jar"},
    {"name": "TLauncher", "desc": "Launcher alternatif Minecraft.", "icon": "tlauncher.png", "cmd": "java -jar /usr/local/bin/TLauncher.jar"},
    {"name": "AI Bot", "desc": "Assistant IA MinecraftOS.", "icon": "bot_icon.png", "cmd": "python3 /usr/local/bin/minecraftos-bot.py"},
    # Applications système installables via pacman/yay
    {"name": "GIMP", "desc": "Éditeur d'images avancé (paquet officiel)", "icon": "gimp.png", "pkg": "gimp"},
    {"name": "VLC", "desc": "Lecteur multimédia universel (paquet officiel)", "icon": "vlc.png", "pkg": "vlc"},
    {"name": "OBS Studio", "desc": "Streaming et capture vidéo (AUR possible)", "icon": "obs.png", "pkg": "obs-studio"},
    {"name": "Discord", "desc": "Chat vocal et texte (AUR possible)", "icon": "discord.png", "pkg": "discord"},
    # Ajoute ici d'autres apps, mods, packs, etc.
]

class StoreApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MinecraftOS Marketplace")
        self.configure(bg=BG_COLOR)
        self.geometry("720x540")
        self.resizable(False, False)
        self.build_ui()

    def build_ui(self):
        tk.Label(self, text="MinecraftOS Store", font=("Minecraftia", 28, "bold"), fg="#fff", bg=BG_COLOR).pack(pady=15)
        frame = tk.Frame(self, bg=BG_COLOR)
        frame.pack(expand=True, fill=tk.BOTH)
        for i, item in enumerate(STORE_CONTENT):
            self.add_card(frame, item, i)

    def add_card(self, parent, item, idx):
        card = tk.Frame(parent, bg=CARD_BG, bd=3, relief=tk.RIDGE)
        card.grid(row=idx//2, column=idx%2, padx=20, pady=15, sticky="nsew")
        # Icone
        icon_path = f"/usr/share/minecraftos/store/{item['icon']}"
        if os.path.exists(icon_path):
            img = Image.open(icon_path).resize((64, 64))
            icon = ImageTk.PhotoImage(img)
            label = tk.Label(card, image=icon, bg=CARD_BG)
            label.image = icon
            label.pack(side=tk.LEFT, padx=10, pady=10)
        else:
            label = tk.Label(card, text="?", font=FONT, bg=CARD_BG, fg="#fff")
            label.pack(side=tk.LEFT, padx=10, pady=10)
        # Infos
        info = tk.Frame(card, bg=CARD_BG)
        info.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tk.Label(info, text=item['name'], font=("Minecraftia", 18, "bold"), fg="#ffe082", bg=CARD_BG).pack(anchor="w")
        tk.Label(info, text=item['desc'], font=FONT, fg="#fff", bg=CARD_BG, wraplength=260, justify=tk.LEFT).pack(anchor="w", pady=2)
        if 'pkg' in item:
            btn = tk.Button(info, text="Installer (pacman/yay)", font=FONT, bg=BTN_COLOR, fg="#fff", command=lambda: self.install_pkg(item['pkg']))
        else:
            btn = tk.Button(info, text="Lancer", font=FONT, bg=BTN_COLOR, fg="#fff", command=lambda: self.run_cmd(item['cmd']))
        btn.pack(anchor="e", pady=8)

    def install_pkg(self, pkg):
        # Essaie d'abord pacman, puis yay si échec (AUR)
        try:
            ret = subprocess.call(f"sudo pacman -S --needed --noconfirm {pkg}", shell=True)
            if ret != 0:
                # Si le paquet n'est pas dans les dépôts officiels, tente yay
                subprocess.call(f"yay -S --needed --noconfirm {pkg}", shell=True)
            messagebox.showinfo("Installation", f"{pkg} installé ou déjà présent.")
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible d'installer : {pkg}\n{e}")

    def run_cmd(self, cmd):
        try:
            subprocess.Popen(cmd, shell=True)
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de lancer : {cmd}\n{e}")

if __name__ == "__main__":
    StoreApp().mainloop()
