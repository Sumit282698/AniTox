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
        const response = await fetch(`http://127.0.0.1:5000/get-episodes/${id}`);
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

async function playRealEpisode(title, epNum) {
    document.getElementById("now-watching-title").innerText = `Searching for Episode ${epNum}...`;
    const res = await fetch(`/get-video/${title}/${epNum}`);
    const data = await res.json();
    
    if (data.youtube_id) {
        loadVideo(data.youtube_id);
        document.getElementById("now-watching-title").innerText = `Watching: ${title} - Ep ${epNum}`;
    }
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
    
    getTopAnime("https://api.jikan.moe/v4/top/anime", topGrid);
});