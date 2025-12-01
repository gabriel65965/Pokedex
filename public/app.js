//Integrantes

//Gabriel Damasceno Venâncio    2512883

//Júlio Vinicius Machado Cunha  2512891

//Enzo Linhares Brasil          2512874

const API_URL = 'https://pokeapi.co/api/v2/pokemon';
const TYPE_API_URL = 'https://pokeapi.co/api/v2/type';
const ITEMS_PER_PAGE = 20;
const MAX_PER_TYPE = 100;


let allPokemons = [];
let visiblePokemons = [];
let currentPage = 1;
let currentSearch = '';
let currentType = '';

window.onload = init;

async function init() {
    const loading = document.getElementById('loading');
    
    
    loading.innerHTML = '';
    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
        loading.innerHTML += '<div class="col-md-3"><div class="skeleton"></div></div>';
    }

    
    try {
        const res = await fetch(TYPE_API_URL);
        const data = await res.json();
        const select = document.getElementById('typeFilter');

        data.results.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Erro ao carregar tipos:', err);
    }

    await getPokemons();
}

async function getPokemons() {
    toggleLoading(true);

    try {
        let pokemonsList = [];

        if (currentType) {
            
            const res = await fetch(`${TYPE_API_URL}/${currentType}`);
            const data = await res.json();
            
            const limit = Math.min(data.pokemon.length, MAX_PER_TYPE);
            pokemonsList = data.pokemon.slice(0, limit).map(p => p.pokemon);
        } else {
            
            const offset = (currentPage - 1) * ITEMS_PER_PAGE;
            const res = await fetch(`${API_URL}?limit=${ITEMS_PER_PAGE}&offset=${offset}`);
            const data = await res.json();
            pokemonsList = data.results;
        }

        
        const promises = pokemonsList.map(p => fetch(p.url).then(res => res.json()));
        allPokemons = await Promise.all(promises);
        
        visiblePokemons = [...allPokemons];
        renderGrid();

    } catch (error) {
        console.error('Erro ao buscar pokemons:', error);
        alert('Ocorreu um erro ao carregar os dados.');
    }
}

function renderGrid() {
    const grid = document.getElementById('pokemonGrid');
    const pageInfo = document.getElementById('pageInfo');
    
    grid.innerHTML = '';

    
    let list = visiblePokemons;
    if (currentSearch) {
        const term = currentSearch.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(term) || p.id.toString().includes(term));
    }

    
    list.forEach(p => {
        
        const typesHtml = p.types.map(t => 
            `<span class="badge type-${t.type.name}">${t.type.name}</span>`
        ).join(' ');

        const card = document.createElement('div');
        card.className = 'col-md-3';
        card.innerHTML = `
            <div class="c" onclick="openDetails(${p.id})">
                <img src="${p.sprites.front_default}" class="i" alt="${p.name}">
                <h5 class="text-center">#${p.id} ${capitalize(p.name)}</h5>
                <div class="text-center">
                    ${typesHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    toggleLoading(false);

    if (currentType) {
        pageInfo.textContent = `Showing ${list.length} pokémons`;
        document.getElementById('prevBtn').disabled = true;
        document.getElementById('nextBtn').disabled = true;
    } else {
        pageInfo.textContent = `Page ${currentPage}`;
        document.getElementById('prevBtn').disabled = currentPage === 1;
        document.getElementById('nextBtn').disabled = false;
    }
}

async function openDetails(id) {
    try {
        const resPoke = await fetch(`${API_URL}/${id}`);
        const pokemon = await resPoke.json();

        const resSpecies = await fetch(pokemon.species.url);
        const species = await resSpecies.json();

        
        const entry = species.flavor_text_entries.find(e => e.language.name === 'en');
        const description = entry ? entry.flavor_text.replace(/\f/g, ' ') : 'No description available.';

        
        const title = `#${pokemon.id} ${capitalize(pokemon.name)}`;
        
        const typesHtml = pokemon.types.map(t => 
            `<span class="badge type-${t.type.name}">${t.type.name}</span>`
        ).join(' ');

        const abilities = pokemon.abilities.map(a => a.ability.name).join(', ');

        const statsHtml = pokemon.stats.map(s => {
            const pct = Math.min(100, Math.round((s.base_stat / 255) * 100));
            return `
                <div>
                    <small>${s.stat.name}: ${s.base_stat}</small>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width:${pct}%"></div>
                    </div>
                </div>`;
        }).join('');

        const modalHtml = `
            <div class="row">
                <div class="col-md-6">
                    <div class="sprite-container">
                        <div><img src="${pokemon.sprites.front_default || ''}" alt="normal"><p class="text-center">Normal</p></div>
                        <div><img src="${pokemon.sprites.front_shiny || ''}" alt="shiny"><p class="text-center">Shiny</p></div>
                    </div>
                    <p><strong>Type:</strong> ${typesHtml}</p>
                    <p><strong>Height:</strong> ${pokemon.height / 10} m</p>
                    <p><strong>Weight:</strong> ${pokemon.weight / 10} kg</p>
                    <p><strong>Abilities:</strong> ${abilities}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Description:</strong></p>
                    <p>${description}</p>
                    <hr>
                    <h6>Stats:</h6>
                    ${statsHtml}
                </div>
            </div>
        `;

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = modalHtml;
        
        const modal = new bootstrap.Modal(document.getElementById('m'));
        modal.show();

    } catch (error) {
        console.error('Erro ao abrir detalhes:', error);
    }
}


async function applyFilters() {
    currentSearch = document.getElementById('s').value;
    const newType = document.getElementById('typeFilter').value;

    if (newType !== currentType) {
        currentType = newType;
        currentPage = 1; 
        await getPokemons();
    } else {
        renderGrid(); 
    }
}

function resetAllFilters() {
    document.getElementById('s').value = '';
    document.getElementById('typeFilter').value = '';
    currentSearch = '';
    currentType = '';
    currentPage = 1;
    getPokemons();
}

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        getPokemons();
    }
}

function goToNextPage() {
    currentPage++;
    getPokemons();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark');
}

function toggleLoading(show) {
    const display = show ? 'flex' : 'none';
    const gridDisplay = show ? 'none' : 'flex';
    document.getElementById('loading').style.display = display;
    document.getElementById('pokemonGrid').style.display = gridDisplay;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}