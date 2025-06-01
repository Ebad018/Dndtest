import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [character, setCharacter] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [characterOptions, setCharacterOptions] = useState({});

  // Character creation state
  const [characterForm, setCharacterForm] = useState({
    name: '',
    race: '',
    character_class: '',
    background: ''
  });

  useEffect(() => {
    fetchCharacterOptions();
  }, []);

  const fetchCharacterOptions = async () => {
    try {
      const response = await axios.get(`${API}/characters/options`);
      setCharacterOptions(response.data);
    } catch (error) {
      console.error('Error fetching character options:', error);
    }
  };

  const createCharacter = async () => {
    if (!characterForm.name || !characterForm.race || !characterForm.character_class || !characterForm.background) {
      alert('Please fill in all character details');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/characters`, characterForm);
      setCharacter(response.data);
      setCurrentView('character-sheet');
    } catch (error) {
      console.error('Error creating character:', error);
      alert('Error creating character. Please try again.');
    }
    setLoading(false);
  };

  const startAdventure = async () => {
    if (!character) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/story/start/${character.id}`);
      setGameSession(response.data.session_id);
      setStory(response.data.story);
      setCurrentView('game');
    } catch (error) {
      console.error('Error starting adventure:', error);
      alert('Error starting adventure. Please try again.');
    }
    setLoading(false);
  };

  const makeChoice = async (choice) => {
    if (!gameSession) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/story/choice/${gameSession}`, {
        choice_text: choice
      });
      setStory(response.data);
    } catch (error) {
      console.error('Error making choice:', error);
      alert('Error processing choice. Please try again.');
    }
    setLoading(false);
  };

  const resetGame = () => {
    setCurrentView('home');
    setCharacter(null);
    setGameSession(null);
    setStory(null);
    setCharacterForm({
      name: '',
      race: '',
      character_class: '',
      background: ''
    });
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-400 mb-4">
            D&D: Unlimited Choices
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Enter a world of dark fantasy where every choice shapes your destiny. 
            Create your character and embark on an adventure limited only by your imagination.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => setCurrentView('character-creation')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-red-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Create Character & Begin Adventure
          </button>
          
          <div className="mt-8 text-sm text-gray-400">
            <p>✨ AI-powered storytelling</p>
            <p>⚔️ Dynamic combat encounters</p>
            <p>🏰 Rich dark fantasy world</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCharacterCreation = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">Create Your Character</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Character Name</label>
              <input
                type="text"
                value={characterForm.name}
                onChange={(e) => setCharacterForm({...characterForm, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your character's name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Race</label>
                <select
                  value={characterForm.race}
                  onChange={(e) => setCharacterForm({...characterForm, race: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Race</option>
                  {characterOptions.races?.map(race => (
                    <option key={race} value={race}>{race}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Class</label>
                <select
                  value={characterForm.character_class}
                  onChange={(e) => setCharacterForm({...characterForm, character_class: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Class</option>
                  {characterOptions.classes?.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Background</label>
                <select
                  value={characterForm.background}
                  onChange={(e) => setCharacterForm({...characterForm, background: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Background</option>
                  {characterOptions.backgrounds?.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                onClick={() => setCurrentView('home')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={createCharacter}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg hover:from-purple-700 hover:to-red-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Creating...' : 'Create Character'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCharacterSheet = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">Character Sheet</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Character Info</h3>
              <div className="space-y-3 text-gray-300">
                <p><span className="font-medium text-purple-300">Name:</span> {character?.name}</p>
                <p><span className="font-medium text-purple-300">Race:</span> {character?.race}</p>
                <p><span className="font-medium text-purple-300">Class:</span> {character?.character_class}</p>
                <p><span className="font-medium text-purple-300">Background:</span> {character?.background}</p>
                <p><span className="font-medium text-purple-300">Level:</span> {character?.level}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Combat Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-purple-300">Hit Points</p>
                  <p className="text-xl font-bold">{character?.hit_points}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-purple-300">Armor Class</p>
                  <p className="text-xl font-bold">{character?.armor_class}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Ability Scores</h3>
              <div className="grid grid-cols-3 gap-3 text-gray-300">
                <div className="bg-gray-700 p-3 rounded text-center">
                  <p className="text-xs text-purple-300">STR</p>
                  <p className="text-lg font-bold">{character?.strength}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded text-center">
                  <p className="text-xs text-purple-300">DEX</p>
                  <p className="text-lg font-bold">{character?.dexterity}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded text-center">
                  <p className="text-xs text-purple-300">CON</p>
                  <p className="text-lg font-bold">{character?.constitution}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded text-center">
                  <p className="text-xs text-purple-300">INT</p>
                  <p className="text-lg font-bold">{character?.intelligence}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded text-center">
                  <p className="text-xs text-purple-300">WIS</p>
                  <p className="text-lg font-bold">{character?.wisdom}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded text-center">
                  <p className="text-xs text-purple-300">CHA</p>
                  <p className="text-lg font-bold">{character?.charisma}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Equipment</h3>
              <div className="space-y-2">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-purple-300">Gold</p>
                  <p className="text-lg font-bold text-yellow-400">{character?.gold} GP</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-purple-300">Inventory</p>
                  <ul className="text-sm text-gray-300">
                    {character?.inventory?.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-8">
            <button
              onClick={() => setCurrentView('character-creation')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Edit Character
            </button>
            <button
              onClick={startAdventure}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg hover:from-purple-700 hover:to-red-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Starting Adventure...' : 'Begin Adventure'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Character Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 sticky top-8">
              <h3 className="text-lg font-bold text-purple-400 mb-4">{character?.name}</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p><span className="text-purple-300">Race:</span> {character?.race}</p>
                <p><span className="text-purple-300">Class:</span> {character?.character_class}</p>
                <p><span className="text-purple-300">Level:</span> {character?.level}</p>
                
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-700 p-2 rounded text-center">
                      <p className="text-purple-300">HP</p>
                      <p className="font-bold">{character?.hit_points}</p>
                    </div>
                    <div className="bg-gray-700 p-2 rounded text-center">
                      <p className="text-purple-300">AC</p>
                      <p className="font-bold">{character?.armor_class}</p>
                    </div>
                  </div>
                </div>

                {story?.location && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-purple-300 text-xs">Current Location:</p>
                    <p className="font-medium">{story.location}</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={resetGame}
                className="w-full mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                New Game
              </button>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8">
              {/* Story Text */}
              <div className="mb-8">
                <div className="bg-gray-900 rounded-lg p-6 border-l-4 border-purple-500">
                  <p className="text-gray-100 text-lg leading-relaxed whitespace-pre-wrap">
                    {story?.story_text}
                  </p>
                  
                  {story?.combat_encounter && (
                    <div className="mt-4 flex items-center text-red-400">
                      <span className="mr-2">⚔️</span>
                      <span className="font-semibold">Combat Encounter!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Choices */}
              {story?.choices && (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-purple-400">What do you do?</h4>
                  <div className="space-y-3">
                    {story.choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => makeChoice(choice)}
                        disabled={loading}
                        className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors border border-gray-600 hover:border-purple-500"
                      >
                        <span className="text-purple-300 font-medium">{index + 1}.</span>
                        <span className="text-gray-100 ml-2">{choice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-gray-300">The story unfolds...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      {currentView === 'home' && renderHome()}
      {currentView === 'character-creation' && renderCharacterCreation()}
      {currentView === 'character-sheet' && renderCharacterSheet()}
      {currentView === 'game' && renderGame()}
    </div>
  );
}

export default App;