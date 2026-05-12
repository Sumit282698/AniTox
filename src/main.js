function hideAll() {
    const sections = ["home", "search", "help", "details", "player-view"];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
    });
}

// Navigation
window.home = () => { hideAll(); document.getElementById("home").hidden = false; };
window.searchAnim = () => { hideAll(); document.getElementById("search").hidden = false; };
window.help = () => { hideAll(); document.getElementById("help").hidden = false; };

// 1. TRIGGER: User clicks "Watch Now"
window.watchNow = (anime) => {
    hideAll();
    document.getElementById("player-view").hidden = false;
    
    // Immediately load the trailer from the API data
    const trailerId = anime.trailer ? anime.trailer.youtube_id : null;
    const player = document.getElementById("anime-player");
    
    if (trailerId) {
        player.src = `https://www.youtube.com/embed/${trailerId}?autoplay=1`;
        document.getElementById("now-watching-title").innerText = `Trailer: ${anime.title_english || anime.title}`;
    }

    // Now fetch the episodes list
    fetchAnimeDetails(anime.mal_id, anime.title_english || anime.title);
};

// Helper to update the iframe
function loadVideo(videoId) {
    const player = document.getElementById("anime-player");
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

// 2. THE WAITER: Gets data from your Python Kitchen
async function fetchAnimeDetails(id, animeTitle) {
    try {
        const response = await fetch(`${id}`);
        const result = await response.json(); 
        
        // Pass the data AND the title to the renderer
        renderEpisodes(result.data, animeTitle); 
    } catch (e) {
        document.getElementById("episode-list").innerHTML = "<p style='color:red;'>Failed to load episodes.</p>";
    }
}

// 3. THE RENDERER: Draws the list on the screen
function renderEpisodes(episodesArray, animeTitle) {
    const list = document.getElementById("episode-list");
    list.innerHTML = ""; 

    episodesArray.forEach(ep => {
        const item = document.createElement("div");
        item.className = "episode-item";
        item.id = `ep-${ep.mal_id}`; // Unique ID for highlighting
        item.innerHTML = `<span>Ep ${ep.mal_id}: ${ep.title}</span>`;
        
        item.onclick = async () => {
            // Remove highlight from previous
            const prev = document.querySelector(".episode-item.active");
            if (prev) prev.classList.remove("active");
            
            // Add highlight to current
            item.classList.add("active");
            
            // Swap trailer for the real episode
            await playRealEpisode(animeTitle, ep.mal_id);
        };
        
        list.appendChild(item);
    });
}

window.showDetails = (anime) => {
    hideAll();
    const content = document.getElementById("details-content");
    
    // Fixed the style string and sanitized the JSON for the button
    content.innerHTML = `
        <img src="${anime.images.jpg.large_image_url}">
        <div class="info-pane">
            <h1 class="red-text">${anime.title_english || anime.title}</h1>
            <p style="font-size: 18px">Rating: ${anime.score || 'N/A'} ⭐</p>
            <p>Total Episodes: ${anime.episodes || '??'}</p>
            <p>Status: ${anime.status}</p>
            <button class="watch-btn" onclick='watchNow(${JSON.stringify(anime).replace(/'/g, "&apos;")})' 
                style="background:var(--red); padding:15px 30px; border:none; color:white; font-weight:bold; cursor:pointer; border-radius:5px; margin-top:20px;">
                ▶ WATCH NOW
            </button>
        </div>
    `;
    document.getElementById("anime-synopsis").innerText = anime.synopsis;
    document.getElementById("details").hidden = false;
};

// Search and Load Logic
document.addEventListener("DOMContentLoaded", () => {
    const topGrid = document.getElementById("top-anime-grid");
    const searchGrid = document.getElementById("search-anime-grid");
    const searchBtn = document.getElementById("done");
    const searchInput = document.getElementById("query_search");

    async function getTopAnime(url, target) {
        if (!target || !url) return; 
        target.innerHTML = "<p style='color:white;'>Loading...</p>";
        try {
            const response = await fetch(url);
            const result = await response.json();
            
            // FIX 1: Access result.data because Jikan wraps the array
            renderGrid(target, result.data); 
        } catch (e) {
            console.error(e);
            target.innerHTML = "<p style='color:var(--red);'>API is OFFLINE </p>";
        }
    }

    function renderGrid(target, list) {
        target.innerHTML = "";
        // Safety check to make sure 'list' is actually an array
        if (!list || list.length === 0) {
            target.innerHTML = "<p style='color:white;'>No results found.</p>";
            return;
        }

        list.forEach(anime => {
            const card = document.createElement("div");
            card.className = "anime-card";
            card.innerHTML = `
                <img src="${anime.images.jpg.image_url}">
                <div class="card-info">
                    <h3>${anime.title_english || anime.title}</h3>
                </div>
            `;
            // Ensure showDetails is defined somewhere else in your code!
            card.onclick = () => typeof showDetails === 'function' && showDetails(anime); 
            target.appendChild(card);
        });
    }

    searchBtn.onclick = () => {
        const query = searchInput.value;
        if (query) {
            // FIX 2: Added the actual search URL
            getTopAnime(`https://jikan.moe{query}`, searchGrid);
        }
    };
    
    getTopAnime("https://api.jikan.moe/v4/top/anime?limit=6", topGrid);
});


// Global Help function update
window.help = () => {
    hideAll();
    document.getElementById("help").hidden = false;
    
    // Get the current day name dynamically
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()]; 
    
    loadSchedule(today);
};

async function loadSchedule(day) {
    const tableBody = document.getElementById("schedule-body");
    
    // Safety check: if the element isn't found, stop here
    if (!tableBody) return;

    tableBody.innerHTML = "<tr><td colspan='2' style='color:white; padding:20px;'>Loading...</td></tr>";

    // Update Tab UI (Highlight selected button)
    document.querySelectorAll('.schedule-tabs button').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(day.substring(0, 3)));
    });

    try {
        const res = await fetch(`https://api.jikan.moe/v4/schedules?filter=${day}`);
        const result = await res.json();
        
        renderScheduleTable(result.data); 
    } catch (err) {
        tableBody.innerHTML = "<tr><td colspan='2' class='red-text'>Failed to load. Try again!</td></tr>";
    }
}

function renderScheduleTable(list) {
    const tableBody = document.getElementById("schedule-body");
    tableBody.innerHTML = ""; 

    if (!list || list.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='2' style='color:white;'>No anime found today.</td></tr>";
        return;
    }

    list.forEach(anime => {
        const row = document.createElement("tr");
        row.className = "schedule-row";
        
        // Use showDetails so clicking a row opens the anime info
        row.onclick = () => showDetails(anime);

        row.innerHTML = `
            <td class="anime-img-cell">
                <img src="${anime.images.jpg.small_image_url}" alt="thumb">
            </td>
            <td class="anime-info-cell">
                <div class="anime-name">${anime.title_english || anime.title}</div>
                <div class="anime-ep">EP: ${anime.episodes || '??'}</div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}