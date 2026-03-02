
// 1. Updated Navigation
// This function ensures a "Clean Slate" before showing a new page
function hideAll() {
    const sections = ["home", "search", "help", "details", "player-view"];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.hidden = true;
        }
    });
}

// Global Navigation Functions
window.home = () => {
    hideAll();
    const homeSection = document.getElementById("home");
    if (homeSection) {
        homeSection.hidden = false;
    } else {
        console.error("Home section ID not found!");
    }
};

window.searchAnim = () => {
    hideAll();
    document.getElementById("search").hidden = false;
};

window.help = () => {
    hideAll();
    document.getElementById("help").hidden = false;
};

window.watchNow = (anime) => {
    hideAll();
    document.getElementById("player-view").hidden = false;
    document.getElementById("now-watching-title").innerText = `Watching: ${anime.title}`;
    
    const epList = document.getElementById("episode-list");
    epList.innerHTML = "";

    // Generate fake episodes based on anime data
    const totalEps = anime.episodes || 12; 
    for (let i = 1; i <= totalEps; i++) {
        const ep = document.createElement("div");
        ep.className = i === 1 ? "ep-item active" : "ep-item";
        ep.innerHTML = `<span>${i}</span> <span>Episode ${i}</span>`;
        ep.onclick = () => {
            document.querySelectorAll('.ep-item').forEach(el => el.classList.remove('active'));
            ep.classList.add('active');
        };
        epList.appendChild(ep);
    }
};

// 2. Update your showDetails function to include a "Watch Now" button
window.showDetails = (anime) => {
    hideAll();
    const content = document.getElementById("details-content");
    content.innerHTML = `
        <img src="${anime.images.jpg.large_image_url}">
        <div class="info-pane">
            <h1 class="red-text">${anime.title}</h1>
            <p>${anime.synopsis}</p>
            <button class="watch-btn" onclick='watchNow(${JSON.stringify(anime).replace(/'/g, "&apos;")})' 
                style="background:var(--red); padding:15px 30px; border:none; color:white; font-weight:bold; cursor:pointer; border-radius:5px; margin-top:20px;">
                ▶ WATCH NOW
            </button>
        </div>
    `;
    document.getElementById("details").hidden = false;
};



document.addEventListener("DOMContentLoaded", () => {
    const topGrid = document.getElementById("top-anime-grid");
    const searchGrid = document.getElementById("search-anime-grid");
    const searchBtn = document.getElementById("done");
    const searchInput = document.getElementById("query_search");

    async function getAnime(url, target) {
        if (!target) return; 
        target.innerHTML = "Loading...";
        try {
            const res = await fetch(url);
            const data = await res.json();
            render(target, data);
        } catch (e) {
            target.innerHTML = "Server Error. Api is OFFLINE";
        }
    }

    function render(target, list) {
    target.innerHTML = "";
    list.forEach(anime => {
        const card = document.createElement("div");
        card.className = "anime-card";
        card.innerHTML = `
            <img src="${anime.images.jpg.image_url}">
            <div class="card-info">
                <h3>${anime.title}</h3>
            </div>
        `;
        
        card.onclick = () => showDetails(anime); 
        
        target.appendChild(card);
    });
}

    searchBtn.onclick = () => {
        getAnime(`http://147.135.213.131:20334/search/${searchInput.value}`, searchGrid);
    };

    getAnime("http://147.135.213.131:20334/get-anime", topGrid);
});