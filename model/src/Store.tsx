import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const COMPANION_API_URL = 'http://localhost:8787';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  author: string;
  icon: string;
  price: string;
}

interface StoreProps {
  onClose: () => void;
}

const Store: React.FC<StoreProps> = ({ onClose }) => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${COMPANION_API_URL}/store-items`);
        if (!response.ok) {
          throw new Error(`Erreur réseau: ${response.status}`);
        }
        const data: StoreItem[] = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Impossible de charger les articles du store:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreItems();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-8 font-minecraft">
      <div 
        className="w-full max-w-6xl h-[90vh] bg-gray-900/95 rounded-lg border-4 border-gray-600 flex flex-col"
      >
        {/* Header */}
        <header className="p-4 flex justify-between items-center border-b-4 border-gray-600">
          <h1 className="text-4xl text-white">Marketplace</h1>
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-red-600/80 flex items-center justify-center rounded-md border-2 border-red-800 hover:bg-red-500"
          >
            <X size={32} className="text-white" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {loading ? (
            <p className="text-white text-2xl">Chargement des trésors...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <div key={item.id} className="bg-gray-800/80 border-2 border-gray-500 rounded-md p-4 flex flex-col text-white transition-transform hover:scale-105 hover:border-yellow-400">
                  <div className="w-full h-48 bg-gray-900/50 rounded p-2 mb-4 flex items-center justify-center">
                    <img src={item.icon} alt={item.name} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  <h2 className="text-2xl text-yellow-300 mb-2">{item.name}</h2>
                  <p className="text-sm text-gray-400 mb-1">par {item.author}</p>
                  <p className="flex-1 text-gray-300 mb-4 text-base">{item.description}</p>
                  <button className="mt-auto w-full py-2 bg-green-600/80 rounded border-2 border-green-800 hover:bg-green-500 text-xl">
                    {item.price}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Store;
