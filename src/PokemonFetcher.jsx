import React, { useState, useEffect, useRef } from 'react';
import './PokemonFetcher.css';
const tipoColores = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  steel: '#B7B7CE',
  fairy: '#D685AD',
  dark: '#705746',
  default: '#c56464', 
};
const PokemonFetcher = () => {
    const [pokemonesMostrados, setPokemonesMostrados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [tipoBusqueda, setTipoBusqueda] = useState('');
    const [lastSearchError, setLastSearchError] = useState(null);
    const [colorContenedor, setColorContenedor] = useState(tipoColores.default); // Estado para el color del contenedor
    const debounceTimeoutRef = useRef(null);
    const lastSuccessfulSearchType = useRef('');

    const buscarPokemonesPorTipo = async (tipo) => {
      setLastSearchError(null); 
      setError(null); 
      if (!tipo) {
          setPokemonesMostrados([]);
          setCargando(false);
          lastSuccessfulSearchType.current = '';
          setColorContenedor(tipoColores.default); // Resetear color
          return;
      }
      setCargando(true);
      try {
          const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${tipo.toLowerCase()}/`);
          
          if (!typeResponse.ok) {
              if (typeResponse.status === 404) {
                  if (tipoBusqueda.toLowerCase() === tipo.toLowerCase()) {
                       setLastSearchError(`No se encontró el tipo "${tipo}". Intenta con otro.`);
                  }
              } else {
                  setLastSearchError(`Error al cargar Pokémon del tipo ${tipo}: ${typeResponse.statusText}`);
              }
              setPokemonesMostrados([]); 
              lastSuccessfulSearchType.current = '';
              setColorContenedor(tipoColores.default); // Resetear color
              return; 
          }

          const typeData = await typeResponse.json();
          const pokemonUrls = typeData.pokemon.map(p => p.pokemon.url);
          const limitedPokemonUrls = pokemonUrls.slice(0, 50);
          const pokemonPromises = limitedPokemonUrls.map(url =>
              fetch(url).then(res => {
                  if (!res.ok) throw new Error(`Error al cargar detalles de Pokémon desde ${url}`);
                  return res.json();
              })
          );

          const detailedPokemonResults = await Promise.all(pokemonPromises);
          const newFetchedPokemones = detailedPokemonResults.map(data => ({
              id: data.id,
              nombre: data.name,
              imagen: data.sprites.front_default,
              tipos: data.types.map(typeInfo => typeInfo.type.name),
          }));
          
          const filteredBySimilarity = newFetchedPokemones.filter(pokemon =>
              pokemon.tipos.some(pokeTipo => 
                  pokeTipo.toLowerCase().includes(tipo.toLowerCase())
              )
          );
          
          setPokemonesMostrados(filteredBySimilarity);
          setLastSearchError(null); 
          lastSuccessfulSearchType.current = tipo.toLowerCase(); 
          setColorContenedor(tipoColores[tipo.toLowerCase()] || tipoColores.default); // Cambiar color del contenedor
      } catch (err) {
          setLastSearchError(`Ocurrió un error inesperado: ${err.message}.`);
          setPokemonesMostrados([]);
          lastSuccessfulSearchType.current = '';
          setColorContenedor(tipoColores.default); // Resetear color

        } finally {
          setCargando(false);
      }
  };
  const handleTipoBusquedaChange = (event) => {
      const value = event.target.value;
      setTipoBusqueda(value);
      if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
      }
      if (value === '') {
          setPokemonesMostrados([]);
          setLastSearchError(null);
          setCargando(false);
          lastSuccessfulSearchType.current = '';
          setColorContenedor(tipoColores.default); // Resetear color
          return;
      }
      debounceTimeoutRef.current = setTimeout(() => {
          buscarPokemonesPorTipo(value);
      }, 500); 
  };
  return (
      <div className='pokemon-container' style={{ backgroundColor: colorContenedor }}>
          <div className="search-bar-container">
              <input
                  type="text"
                  placeholder="Buscar por tipo (ej: fire)"
                  value={tipoBusqueda}
                  onChange={handleTipoBusquedaChange}
                  className="pokemon-search-input"
              />
          </div>
          <h2>
              {tipoBusqueda ? `Pokémon de tipo "${tipoBusqueda.charAt(0).toUpperCase() + tipoBusqueda.slice(1)}"` : 'Ingresa un tipo para buscar Pokémon'}
          </h2>
          {lastSearchError && <div className="pokemon-container error">{lastSearchError}</div>}
          {cargando ? (
              <div className="pokemon-container">Cargando Pokémon...</div>
          ) : (
              <div className="pokemon-list">
                  {pokemonesMostrados.length > 0 && !lastSearchError &&
                   tipoBusqueda.toLowerCase().includes(lastSuccessfulSearchType.current) ? (
                      pokemonesMostrados.map(pokemon => (
                          <div key={pokemon.id} className="pokemon-card">
                              <h3>{pokemon.nombre.charAt(0).toUpperCase() + pokemon.nombre.slice(1)}</h3>
                              <img src={pokemon.imagen} alt={pokemon.nombre} />
                              <p>
                                  **Tipos:** {pokemon.tipos.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}
                              </p>
                          </div>
                      ))
                    ) : (
                      !lastSearchError && tipoBusqueda && pokemonesMostrados.length === 0 &&
                      <p>No se encontraron Pokémon con el tipo "{tipoBusqueda}".</p>
                  )}
              </div>
          )}
      </div>
  );
};
export default PokemonFetcher;