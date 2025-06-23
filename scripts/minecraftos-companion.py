#!/usr/bin/env python3
#!/usr/bin/env python3
import os
import subprocess
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler

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
# Le chemin vers le dossier des icônes SVG
ICONS_DIR = "/usr/share/icons/minecraftos/SVG"
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
        else:
            self._send_json_response(404, {"error": "Endpoint non trouvé"})

def run_server(server_class=HTTPServer, handler_class=CompanionRequestHandler, port=8787):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info(f"Serveur compagnon démarré sur le port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
