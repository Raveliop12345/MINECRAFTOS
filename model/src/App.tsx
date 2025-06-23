import React, { useState, useEffect } from 'react';
import { Clock, Play } from 'lucide-react';

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

  const handleStartClick = () => {
    console.log('Clic sur le bouton de démarrage');
  };

  const handleIABotClick = () => {
    setShowAIAssistant(!showAIAssistant);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    console.log(`Message envoyé : ${message}`);
    setMessage('');
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
              <button
                onClick={handleSendMessage}
                className="bg-cyan-500 hover:bg-cyan-400 text-white p-3 rounded-lg transition-colors duration-200 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Minecraft Character - Now on same line */}
          <div className="flex-shrink-0">
            <div 
              className="w-32 h-40 bg-contain bg-no-repeat bg-center transform hover:scale-105 transition-transform duration-300"
              style={{
                backgroundImage: `url('/body.png')`
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm h-16 flex items-center justify-between px-6 border-t border-slate-700">
        {/* Start Menu with Custom Start Button */}
        <div className="flex items-center space-x-4">
          {/* Custom Start Button */}
          <div 
            className="flex items-center group cursor-pointer"
            onClick={handleStartClick}
          >
            <div className="relative">
              {/* Main Start Button */}
              <div className="w-12 h-12 rounded-lg shadow-lg hover:scale-110 transition-all duration-300 transform hover:rotate-3 relative overflow-hidden border-2 border-green-600/50">
                <div 
                  className="w-full h-full bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('/ChatGPT Image 22 juin 2025, 15_27_29.png')`
                  }}
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-lg"></div>
                {/* Shine effect */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full blur-sm"></div>
              </div>
              
              {/* Outer glow */}
              <div className="absolute -inset-1 w-14 h-14 bg-green-400/10 rounded-xl blur-md group-hover:bg-green-400/20 transition-all duration-300"></div>
              
              {/* Play icon indicator */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border border-green-400 group-hover:scale-110 transition-transform duration-200">
                <Play className="w-2 h-2 text-white fill-white" />
              </div>
            </div>
          </div>

          {/* IA-BOT Button - Now clickable to toggle assistant */}
          <div 
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              showAIAssistant 
                ? 'bg-cyan-600 hover:bg-cyan-500' 
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            onClick={handleIABotClick}
          >
            <Package className={`w-6 h-6 ${showAIAssistant ? 'text-white' : 'text-green-400'}`} />
            <span className="text-white font-bold text-lg">IA-BOT</span>
            {showAIAssistant && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>

          {/* Chat Icon */}
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-400 transition-colors">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* System Tray */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-white">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="font-mono text-lg">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;