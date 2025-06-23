import React, { useState, useEffect } from 'react';
import { Clock, Play, Send } from 'lucide-react';

// --- Constantes ---
const COMPANION_API_URL = 'http://localhost:8787';

// --- Types ---
interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
}

// --- Composant d'icône ---
const AppIcon: React.FC<{ icon: DesktopIcon; onDoubleClick: (id: string) => void }> = ({ icon, onDoubleClick }) => (
  <div 
    className="flex flex-col items-center text-white w-24 text-center cursor-pointer"
    onDoubleClick={() => onDoubleClick(icon.id)}
  >
    <div className="w-16 h-16 bg-gray-700/50 flex items-center justify-center rounded-lg border-2 border-gray-500 hover:border-yellow-400 transition-all duration-150">
      <img src={icon.icon} alt={icon.name} className="w-12 h-12" />
    </div>
    <span className="mt-1 text-sm break-words">{icon.name}</span>
  </div>
);

// --- Composant Principal ---
function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // --- Effets ---
  useEffect(() => {
    // Horloge
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Chargement des icônes du bureau
    const fetchDesktopIcons = async () => {
      try {
        const response = await fetch(`${COMPANION_API_URL}/desktop-icons`);
        if (!response.ok) {
          throw new Error(`Le serveur a répondu avec le statut : ${response.status}`);
        }
        const data: DesktopIcon[] = await response.json();
        setDesktopIcons(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des icônes:", err);
        setError("Impossible de charger les icônes du bureau. Le serveur compagnon est-il lancé ?");
      }
    };

    fetchDesktopIcons();

    return () => clearInterval(timer);
  }, []);

  // --- Fonctions ---
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleIconDoubleClick = async (appId: string) => {
    console.log(`Lancement de l'application : ${appId}`);
    try {
      const response = await fetch(`${COMPANION_API_URL}/launch-app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ app_id: appId }),
      });
      if (!response.ok) {
        throw new Error(`Erreur lors du lancement de l'application.`);
      }
      console.log(`App ${appId} lancée avec succès.`);
    } catch (err) {
      console.error("Erreur de lancement:", err);
      setError(`Impossible de lancer l'application ${appId}.`);
    }
  };

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Future AI logic here
      console.log(message);
      setMessage('');
    }
  };

  // --- Rendu ---
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('/minecraft_wallpaper.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Grille d'icônes du bureau */}
      <main className="p-4 grid grid-cols-8 auto-rows-min gap-4">
        {desktopIcons.map(icon => (
          <AppIcon key={icon.id} icon={icon} onDoubleClick={handleIconDoubleClick} />
        ))}
      </main>

      {/* Affichage d'erreur */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-800/90 text-white p-3 rounded-lg border-2 border-red-500">
          <strong>Erreur :</strong> {error}
        </div>
      )}
      
      {/* Personnage IA cliquable */}
      <div
        className="absolute left-4 bottom-20 w-24 h-24 cursor-pointer hover:scale-110 transition-transform"
        onClick={toggleAIAssistant}
        style={{
          backgroundImage: `url('/compass.svg')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom center',
          visibility: showAIAssistant ? 'hidden' : 'visible'
        }}
      ></div>

      {/* Assistant IA flottant */}
      {showAIAssistant && (
        <div className="absolute left-4 bottom-20 w-80 h-96 bg-black/70 rounded-lg p-4 flex flex-col text-white border-2 border-gray-600 animate-in slide-in-from-bottom-5">
           <div className="flex justify-between items-center mb-2">
             <h3 className="font-bold">MINECRAFTOS-BOT</h3>
             <button onClick={toggleAIAssistant} className="text-gray-400 hover:text-white">X</button>
           </div>
          <div className="flex-grow overflow-y-auto mb-2 pr-2 bg-black/20 p-2 rounded">
            <div className="text-sm">
              <span className="font-bold text-cyan-400">[BOT]</span> Salut ! Comment puis-je t'aider ?
            </div>
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-grow bg-gray-800 border border-gray-600 rounded-l-md p-2 focus:outline-none focus:border-yellow-500"
              placeholder="Votre message..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-r-md"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Barre des tâches */}
      <footer className="absolute bottom-0 left-0 right-0 h-16 bg-black/80 flex items-center justify-between px-4 border-t-2 border-gray-700">
        <div className="flex items-center space-x-4">
          <button className="w-12 h-12 bg-gray-700 flex items-center justify-center rounded-md border-2 border-gray-500 hover:border-yellow-400">
            <Play size={28} className="text-white" />
          </button>
        </div>

        <div className="flex items-center space-x-2 text-white bg-gray-900/80 px-3 py-1 rounded-md border border-gray-600">
          <Clock size={20} />
          <span className="font-mono text-lg">{formatTime(currentTime)}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;