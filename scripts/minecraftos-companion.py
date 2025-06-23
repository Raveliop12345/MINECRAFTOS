#!/usr/bin/env python3
#!/usr/bin/env python3
import os
import subprocess
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
import google.generativeai as genai

# --- Configuration du Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.expanduser("~/.minecraftos_companion.log")),
        logging.StreamHandler()
    ]
)

# --- Configuration des Applications ---
# Déterminer le chemin des icônes en fonction de l'environnement
DEV_ICON_DIR = os.path.join(os.path.dirname(__file__), '..', 'Minecraft-Icons', 'SVG')
PROD_ICON_DIR = '/usr/share/icons/minecraftos/SVG'

if os.path.exists(DEV_ICON_DIR):
    ICONS_DIR = DEV_ICON_DIR
    logging.info(f"Utilisation du répertoire d'icônes de développement : {ICONS_DIR}")
else:
    ICONS_DIR = PROD_ICON_DIR
    logging.info(f"Utilisation du répertoire d'icônes de production : {ICONS_DIR}")

# Définition des applications de bureau
DESKTOP_APPS = {
    "files": {
        "name": "Fichiers",
        "icon": "files.svg",
        "command": "thunar"
    },
    "terminal": {
        "name": "Terminal",
        "icon": "terminal.svg",
        "command": "lxterminal"
    },
    "store": {
        "name": "Store",
        "icon": "store.svg",
        "command": "python3 /usr/local/bin/minecraftos_scripts/minecraftos-store.py"
    }
}

# --- Configuration de l'API Gemini ---
def load_gemini_config():
    config_path = os.path.expanduser("~/.config/minecraftos/bot_config.json")
    if not os.path.exists(config_path):
        logging.error(f"Fichier de configuration du bot introuvable à {config_path}")
        return None
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        api_key = config.get("GEMINI_API_KEY")
        if not api_key or api_key == "YOUR_API_KEY_HERE":
            logging.error("Clé API Gemini non trouvée ou non configurée dans le fichier.")
            return None
        return api_key
    except Exception as e:
        logging.error(f"Erreur lors de la lecture du fichier de configuration : {e}")
        return None

API_KEY = load_gemini_config()
MODEL = None
if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        MODEL = genai.GenerativeModel('gemini-pro')
        logging.info("API Gemini configurée avec succès.")
    except Exception as e:
        logging.error(f"Échec de l'initialisation du modèle Gemini : {e}")
        API_KEY = None # Désactiver si l'initialisation échoue
else:
    logging.warning("Clé API Gemini non configurée. La fonctionnalité de chat sera désactivée.")


class CompanionRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        if self.path == '/desktop-icons':
            try:
                # Lister les fichiers SVG dans le dossier d'icônes
                available_icons = [f for f in os.listdir(ICONS_DIR) if f.endswith('.svg')]
                
                # Filtrer les applications pour n'inclure que celles dont l'icône existe
                apps_with_icons = []
                for app_id, app_data in DESKTOP_APPS.items():
                    if app_data['icon'] in available_icons:
                        apps_with_icons.append({
                            "id": app_id,
                            "name": app_data['name'],
                            "icon": f"file://{os.path.join(ICONS_DIR, app_data['icon'])}"
                        })
                
                self._send_json_response(200, apps_with_icons)
            except Exception as e:
                logging.error(f"Erreur lors de la récupération des icônes : {e}")
                self._send_json_response(500, {"error": "Impossible de lister les icônes du bureau."})
        else:
            self._send_json_response(404, {"error": "Endpoint non trouvé"})

    def do_POST(self):
        if self.path == '/launch-app':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                app_id = data.get('app_id')

                if not app_id or app_id not in DESKTOP_APPS:
                    self._send_json_response(400, {"error": "ID d'application manquant ou invalide."})
                    return

                command = DESKTOP_APPS[app_id]['command']
                logging.info(f"Lancement de la commande : {command}")
                
                # Lancer la commande en arrière-plan sans attendre la fin
                subprocess.Popen(command, shell=True, start_new_session=True)
                
                self._send_json_response(200, {"status": "success", "message": f"L'application '{app_id}' a été lancée."})

            except json.JSONDecodeError:
                self._send_json_response(400, {"error": "Données JSON invalides."})
            except Exception as e:
                logging.error(f"Erreur lors du lancement de l'application : {e}")
                self._send_json_response(500, {"error": f"Erreur interne du serveur : {e}"})
        
        elif self.path == '/chat':
            if not API_KEY or not MODEL:
                self._send_json_response(503, {"error": "Le service de chat n'est pas configuré correctement sur le serveur."})
                return
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                user_message = data.get('message')

                if not user_message:
                    self._send_json_response(400, {"error": "Message manquant."})
                    return
                
                logging.info(f"Message reçu pour le chat : '{user_message}'")
                
                response = MODEL.generate_content(user_message)
                
                bot_response = response.text
                logging.info(f"Réponse de Gemini : '{bot_response}'")

                self._send_json_response(200, {"reply": bot_response})

            except json.JSONDecodeError:
                self._send_json_response(400, {"error": "Données JSON invalides."})
            except Exception as e:
                logging.error(f"Erreur lors de l'interaction avec l'API Gemini : {e}")
                self._send_json_response(500, {"error": f"Erreur interne du serveur lors du chat : {e}"})
        
        else:
            self._send_json_response(404, {"error": "Endpoint non trouvé"})

def run_server(server_class=HTTPServer, handler_class=CompanionRequestHandler, port=8787):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info(f"Serveur compagnon démarré sur le port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
