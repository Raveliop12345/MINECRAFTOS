import React, { useState, useEffect } from 'react';
import { Send, Folder, File, Server, HardDrive } from 'lucide-react';

const COMPANION_API_URL = 'http://localhost:8787';

interface DesktopIcon { id: string; name: string; icon: string; }
interface ChatMessage { sender: 'user' | 'bot'; text: string; }
interface WindowState { id: string; title: string; component: React.ReactNode; }

const DraggableWindow: React.FC<{ windowState: WindowState; onClose: (id: string) => void }> = ({ windowState, onClose }) => {
  const [position, setPosition] = useState({ x: window.innerWidth / 4, y: window.innerHeight / 5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="absolute w-[600px] h-[400px] bg-[#c6c6c6] border-4 border-t-[#c6c6c6] border-l-[#c6c6c6] border-r-[#5a5a5a] border-b-[#5a5a5a] rounded-sm flex flex-col shadow-2xl z-20"
      style={{ top: position.y, left: position.x }}
    >
      <div className="h-8 bg-[#0000a8] text-white flex items-center justify-between px-2 font-bold cursor-move select-none" onMouseDown={handleMouseDown}>
        <span>{windowState.title}</span>
        <button onClick={() => onClose(windowState.id)} className="w-6 h-6 bg-[#c6c6c6] border-2 border-t-white border-l-white border-r-black border-b-black text-black flex items-center justify-center font-bold pb-1 hover:bg-gray-400">x</button>
      </div>
      <div className="flex-grow bg-[#c6c6c6] p-2 overflow-y-auto">
        {windowState.component}
      </div>
    </div>
  );
};

const FileManagerUI = () => {
  const files = [
    { name: 'Mes Documents', icon: <Folder/> }, { name: 'Téléchargements', icon: <Folder/> },
    { name: 'musique_lofi.mp3', icon: <File/> }, { name: 'serveur_minecraft.jar', icon: <Server/> },
    { name: 'Disque Local (C:)', icon: <HardDrive/> },
  ];
  return (
    <div className="grid grid-cols-5 gap-4">
      {files.map(file => (
        <div key={file.name} className="flex flex-col items-center p-2 hover:bg-blue-200/50 rounded-sm cursor-pointer">
          <div className="w-16 h-16 text-gray-800">{React.cloneElement(file.icon, { size: 48 })}</div>
          <span className="text-xs text-center mt-1 text-black">{file.name}</span>
        </div>
      ))}
    </div>
  );
};

const TerminalUI = () => {
  const [history, setHistory] = useState<string[]>(['MinecraftOS Terminal [Version 1.0]', '(c) 2025 ARCHLORD Corp.']);
  const [input, setInput] = useState('');
  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newHistory = [...history, `> ${input}`];
      if (input.toLowerCase() === 'help') newHistory.push('Commandes: help, clear, exit');
      else if (input.toLowerCase() === 'clear') setHistory([]);
      else newHistory.push(`'${input}' n'est pas une commande valide.`);
      setHistory(newHistory);
      setInput('');
    }
  };
  return (
    <div className="bg-black text-green-400 font-mono h-full p-2 text-sm" onClick={() => document.getElementById('terminal-input')?.focus()}>
      {history.map((line, i) => <p key={i}>{line}</p>)}
      <div className="flex"><span className='pr-2'>{'>'}</span><input id="terminal-input" type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleInput} className="bg-transparent border-none text-green-400 w-full focus:outline-none" autoFocus /></div>
    </div>
  );
};

const SettingsUI = () => (
  <div className="p-4 text-black flex flex-col gap-4">
    <h2 className="text-lg font-bold">Paramètres</h2>
    {[ 'Musique: 50%', 'Graphismes: Épiques', 'Difficulté: Paisible' ].map(setting => (
        <button key={setting} className="bg-[#c6c6c6] border-2 border-t-white border-l-white border-r-black border-b-black p-2 text-black hover:bg-gray-400 text-left">
            {setting}
        </button>
    ))}
  </div>
);

const BrowserUI = () => (
  <div className="flex flex-col h-full bg-white text-black">
    <div className="flex items-center p-1 bg-gray-300 gap-1"><input type="text" readOnly value="http://www.minenetonline.com" className="flex-grow bg-white p-1 border border-gray-500" /></div>
    <div className="flex-grow p-4"><h1 className="text-2xl font-bold">Bienvenue sur MineNet !</h1><p>Votre portail vers le monde des blocs.</p></div>
  </div>
);

const BootScreen = () => (
  <div className="w-screen h-screen bg-[#0000a8] flex flex-col items-center justify-center font-minecraft text-white">
    <img src="/start_logo.png" alt="Logo" className="w-48 h-48 mb-8" style={{ imageRendering: 'pixelated' }} />
    <div className="w-1/3 bg-gray-700 border-2 border-gray-500 p-1">
      <div className="h-4 bg-green-500 animate-pulse" style={{ width: `100%`, animation: 'progressBar 15s linear forwards' }}></div>
    </div>
    <p className="mt-4 text-lg">Démarrage de MinecraftOS...</p>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([{ sender: 'bot', text: "Salutations, ARCHLORD ! Bienvenue sur votre bureau." }]);
  const [openWindows, setOpenWindows] = useState<WindowState[]>([]);

  useEffect(() => {
    const bootTimer = setTimeout(() => setIsLoading(false), 15000);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(bootTimer);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return; // N'exécutez pas si l'écran de démarrage est actif

    const fetchDesktopIcons = async () => {
      try {
        const response = await fetch(`${COMPANION_API_URL}/desktop-icons`);
        if (!response.ok) throw new Error(`Le serveur compagnon ne répond pas.`);
        const data: DesktopIcon[] = await response.json();
        setDesktopIcons(data.map(icon => ({...icon, icon: `${COMPANION_API_URL}${icon.icon}`})));
      } catch (err) { setError("Impossible de charger les icônes. Le script compagnon est-il bien lancé ?"); }
    };
    fetchDesktopIcons();
  }, [isLoading]);

  const handleIconDoubleClick = (appId: string) => {
    if (openWindows.find(w => w.id === appId)) return;
    let newWindow: WindowState | null = null;
    if (appId === 'file_manager') newWindow = { id: appId, title: 'Fichiers', component: <FileManagerUI /> };
    else if (appId === 'terminal') newWindow = { id: appId, title: 'Terminal', component: <TerminalUI /> };
    else if (appId === 'settings') newWindow = { id: appId, title: 'Paramètres', component: <SettingsUI /> };
    else if (appId === 'browser') newWindow = { id: appId, title: 'Explorateur MineNet', component: <BrowserUI /> };
    if (newWindow) setOpenWindows(prev => [...prev, newWindow!]);
  };

  const handleCloseWindow = (id: string) => setOpenWindows(prev => prev.filter(w => w.id !== id));

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    setConversation(prev => [...prev, { sender: 'user', text: trimmedMessage }]);
    setMessage('');
    setIsBotTyping(true);
    try {
      const response = await fetch(`${COMPANION_API_URL}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: trimmedMessage }) });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }
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

  const AppIcon: React.FC<{ icon: DesktopIcon; onDoubleClick: (id: string) => void }> = ({ icon, onDoubleClick }) => (
    <div className="flex items-center gap-3 text-white w-40 cursor-pointer p-2 rounded-md bg-black/30 hover:bg-black/50 border border-transparent hover:border-gray-500 transition-all duration-150" onDoubleClick={() => onDoubleClick(icon.id)}>
      <div className="w-10 h-10 flex items-center justify-center"><img src={icon.icon} alt={icon.name} className="w-full h-full" style={{ imageRendering: 'pixelated' }} /></div>
      <span className="text-sm font-bold">{icon.name}</span>
    </div>
  );

  if (isLoading) {
    return <BootScreen />;
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden font-minecraft" style={{ backgroundImage: `url('/minecraft_wallpaper.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <main className="absolute top-5 left-5 flex flex-col gap-4 z-10">
        {desktopIcons.map(icon => <AppIcon key={icon.id} icon={icon} onDoubleClick={handleIconDoubleClick} />)}
      </main>

      {openWindows.map(win => <DraggableWindow key={win.id} windowState={win} onClose={handleCloseWindow} />)}

      {error && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-800/90 text-white p-3 rounded-lg border-2 border-red-500 z-50"><strong>Erreur :</strong> {error}</div>}
      
      <div className="absolute right-4 bottom-24 flex items-end gap-4 z-30">
        <img src="/bot_skin.png" alt="MINECRAFTOS-BOT" className="w-24 h-48 object-contain object-bottom drop-shadow-2xl" style={{ imageRendering: 'pixelated' }} />
        <div className="w-[400px] h-[500px] bg-[#1e1f22]/80 rounded-lg p-4 flex flex-col text-white border-2 border-gray-600 backdrop-blur-sm">
           <h3 className="font-bold text-lg mb-2">MINECRAFTOS-BOT</h3>
           <div className="flex-grow overflow-y-auto mb-2 pr-2 bg-black/20 p-2 rounded scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            {conversation.map((chat, index) => (
              <div key={index} className={`w-full flex items-start gap-2 mb-3`}><div className={`p-2 rounded-lg max-w-full text-left ${chat.sender === 'user' ? 'bg-gray-600' : 'bg-transparent'}`}><p className="whitespace-pre-wrap text-sm leading-relaxed">{chat.text}</p></div></div>
            ))}
            {isBotTyping && <div className="text-sm text-gray-400 p-2">BOT est en train d'écrire...</div>}
          </div>
          <div className="flex">
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type here..." className="flex-grow bg-gray-800 border-2 border-gray-600 rounded-l-md p-2 focus:outline-none focus:border-cyan-400" />
            <button onClick={handleSendMessage} className="bg-cyan-500 text-black p-2 rounded-r-md hover:bg-cyan-400"><Send size={20} /></button>
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-4 border-t-2 border-gray-700 z-40">
        <div className="flex items-center gap-2"><button onClick={() => console.log("Start Menu Clicked")} className="bg-gray-700 p-2 rounded-md hover:bg-gray-600"><img src={`/start_logo.png`} alt="Start" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} /></button></div>
        <div className="text-white text-sm">{formatTime(currentTime)}</div>
      </footer>
    </div>
  );
}

export default App;