function hideAll() {
    const sections = ["home", "search", "help", "details", "player-view"];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
    });
}

window.home = () => { hideAll(); document.getElementById("home").hidden = false; };
window.searchAnim = () => { hideAll(); document.getElementById("search").hidden = false; };
window.help = () => { hideAll(); document.getElementById("help").hidden = false; };

window.watchNow = (anime) => {
    hideAll();
    const playerView = document.getElementById("player-view");
    const player = document.getElementById("anime-player");
    const titleHeader = document.getElementById("now-watching-title");
    
    playerView.hidden = false;
    const trailerId = anime.trailer ? anime.trailer.youtube_id : null;

    if (trailerId) {
        player.src = `https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0`;
        titleHeader.innerText = `Watching Trailer: ${anime.title_english || anime.title}`;
    } else {
        player.src = ""; 
        titleHeader.innerText = `No trailer available for ${anime.title_english || anime.title}`;
    }
    fetchAnimeDetails(anime.mal_id, anime.title_english || anime.title);
};

function loadVideo(videoId) {
    const player = document.getElementById("anime-player");
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

async function fetchAnimeDetails(id, animeTitle) {
    const epListContainer = document.getElementById("episode-list");
    epListContainer.innerHTML = "<p style='color:white;'>Loading Episodes...</p>";

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);
        const result = await response.json(); 
        renderEpisodes(result.data, animeTitle); 
    } catch (e) {
        console.error("Episode Load Error:", e);
        epListContainer.innerHTML = "<p style='color:red;'>Episodes not available.</p>";
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
            const prev = document.querySelector(".episode-item.active");
            if (prev) prev.classList.remove("active");
            
            item.classList.add("active");
            
            await playRealEpisode(animeTitle, ep.mal_id);
        };
        
        list.appendChild(item);
    });
}

window.showDetails = (anime) => {
    hideAll();
    const content = document.getElementById("details-content");
    
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

document.addEventListener("DOMContentLoaded", () => {
    const topGrid = document.getElementById("top-anime-grid");
    const upcomingGrid = document.getElementById("upcoming-anime-grid");
    const airingGrid = document.getElementById("airing-anime-grid")
    const searchGrid = document.getElementById("search-anime-grid");
    const popularGrid = document.getElementById("popular-anime-grid");
    const favGrid = document.getElementById("fav-anime-grid");
    const searchBtn = document.getElementById("done");
    const searchInput = document.getElementById("query_search");
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function fetchAndRender(url, target) {
        if (!target || !url) return; 
        target.innerHTML = "<p style='color:white;'>Loading...</p>";
        try {
            const response = await fetch(url);
            const result = await response.json();
            renderGrid(target, result.data); 
        } catch (e) {
            console.error("Fetch Error:", e);
            target.innerHTML = "<p style='color:var(--red);'>API is OFFLINE</p>";
        }
    }

    function renderGrid(target, list) {
        target.innerHTML = "";
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
            card.onclick = () => typeof showDetails === 'function' && showDetails(anime); 
            target.appendChild(card);
        });
    }

    searchBtn.onclick = () => {
        const query = searchInput.value;
        if (query) {
            fetchAndRender(`https://api.jikan.moe/v4/anime?q=${query}&limit=20`, searchGrid);
        }
    };
    
    async function initHome() {
        fetchAndRender("https://api.jikan.moe/v4/top/anime?filter=airing", airingGrid);
        fetchAndRender("https://api.jikan.moe/v4/top/anime?limit=15", topGrid);
        fetchAndRender("https://api.jikan.moe/v4/top/anime?filter=upcoming&limit=15", upcomingGrid);
        await sleep(2000);
        fetchAndRender("https://api.jikan.moe/v4/top/anime?filter=favorite&limit=15", favGrid);
        fetchAndRender("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=15", popularGrid);
        
}

initHome();
    
});

window.help = () => {
    hideAll();
    document.getElementById("help").hidden = false;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()]; 
    
    loadSchedule(today);
};

async function loadSchedule(day) {
    const tableBody = document.getElementById("schedule-body");
    
    if (!tableBody) return;

    tableBody.innerHTML = "<tr><td colspan='2' style='color:white; padding:20px;'>Loading...</td></tr>";

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