import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import Store from './Store';

// --- Constantes ---
const COMPANION_API_URL = 'http://localhost:8787';

// --- Types ---
interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

// --- Composant d'icône ---
const AppIcon: React.FC<{ icon: DesktopIcon; onDoubleClick: (id: string) => void }> = ({ icon, onDoubleClick }) => (
  <div 
    className="flex flex-col items-center text-white w-24 text-center cursor-pointer"
    onDoubleClick={() => onDoubleClick(icon.id)}
  >
    <div className="w-16 h-16 bg-gray-700/50 flex items-center justify-center rounded-lg border-2 border-gray-500 hover:border-yellow-400 transition-all duration-150">
      <img src={icon.icon} alt={icon.name} className="w-12 h-12" style={{ imageRendering: 'pixelated' }} />
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
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Salutations, ARCHLORD ! Prêt pour une nouvelle aventure ?" }
  ]);

  // --- Effets ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const fetchDesktopIcons = async () => {
      try {
        const response = await fetch(`${COMPANION_API_URL}/desktop-icons`);
        if (!response.ok) throw new Error(`Le serveur a répondu avec le statut : ${response.status}`);
        const data: DesktopIcon[] = await response.json();
        // Préfixer les URLs relatives des icônes avec l'URL de base de l'API
        const fullPathIcons = data.map(icon => ({...icon, icon: `${COMPANION_API_URL}${icon.icon}`}));
        setDesktopIcons(fullPathIcons);
      } catch (err) {
        console.error("Erreur lors de la récupération des icônes:", err);
        setError("Impossible de charger les icônes. Le compagnon est-il lancé ?");
      }
    };

    fetchDesktopIcons();
    return () => clearInterval(timer);
  }, []);

  // --- Fonctions ---
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleIconDoubleClick = async (appId: string) => {
    if (appId === 'store') {
      setShowStore(true);
      return;
    }
    console.log(`Lancement de l'application : ${appId}`);
    try {
      const response = await fetch(`${COMPANION_API_URL}/launch-app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId }),
      });
      if (!response.ok) throw new Error(`Erreur lors du lancement de l'application.`);
      console.log(`App ${appId} lancée avec succès.`);
    } catch (err) {
      console.error("Erreur de lancement:", err);
      setError(`Impossible de lancer l'application ${appId}.`);
    }
  };

  const toggleAIAssistant = () => setShowAIAssistant(!showAIAssistant);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: trimmedMessage };
    setConversation(prev => [...prev, newUserMessage]);
    setMessage('');
    setIsBotTyping(true);

    try {
      const response = await fetch(`${COMPANION_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur serveur: ${response.status}`);
      }
      const data = await response.json();
      const botReply: ChatMessage = { sender: 'bot', text: data.reply };
      setConversation(prev => [...prev, botReply]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
      const botError: ChatMessage = { sender: 'bot', text: `Désolé, une erreur est survenue : ${errorMessage}` };
      setConversation(prev => [...prev, botError]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // --- Rendu ---
  if (showStore) {
    return <Store onClose={() => setShowStore(false)} />;
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden font-minecraft"
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
          backgroundImage: `url('/bot_skin.png')`,
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
            {conversation.map((chat, index) => (
              <div key={index} className={`w-full flex items-end gap-2 mb-2 ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* Pour le bot, l'avatar est à gauche et le texte à droite */}
                {chat.sender === 'bot' && (
                  <>
                    <img
                      src="/bot_skin.png"
                      alt="bot avatar"
                      className="w-10 h-10 rounded-lg bg-gray-800 border-2 border-cyan-400 self-start"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className={`inline-block p-2 rounded-lg max-w-[80%] text-left bg-gray-700 text-white`}>
                      <span className={`font-bold block text-xs mb-1 text-cyan-400`}>
                        MINECRAFTOS-BOT
                      </span>
                      <p className="whitespace-pre-wrap text-sm">{chat.text}</p>
                    </div>
                  </>
                )}
                {/* Pour l'utilisateur, le texte est seul et à droite */}
                {chat.sender === 'user' && (
                  <div className={`inline-block p-2 rounded-lg max-w-[80%] text-left bg-yellow-600 text-black`}>
                    <span className={`font-bold block text-xs mb-1 text-gray-800`}>
                      VOUS
                    </span>
                    <p className="whitespace-pre-wrap text-sm">{chat.text}</p>
                  </div>
                )}
              </div>
            ))}
            {isBotTyping && (
              <div className="text-sm text-gray-400 p-2">
                <span className="font-bold text-cyan-400">BOT</span> est en train d'écrire...
              </div>
            )}
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Envoyer un message..."
              className="flex-grow bg-gray-800 border-2 border-gray-600 rounded-l-md p-2 focus:outline-none focus:border-yellow-400"
            />
            <button onClick={handleSendMessage} className="bg-yellow-500 text-black p-2 rounded-r-md hover:bg-yellow-400">
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Barre des tâches */}
      <footer className="absolute bottom-0 left-0 right-0 h-16 bg-black/80 flex items-center justify-between px-4 border-t-2 border-gray-700">
        <div className="flex items-center space-x-4">
          <button className="w-12 h-12 bg-gray-700 flex items-center justify-center rounded-md border-2 border-gray-500 hover:border-yellow-400 p-1">
            <img src="/ChatGPT Image 22 juin 2025, 15_27_29.png" alt="Start Menu" className="w-full h-full object-contain" />
          </button>
        </div>

        <div className="text-white font-bold text-lg">
          <span>{formatTime(currentTime)}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;