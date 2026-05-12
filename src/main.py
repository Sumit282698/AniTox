import requests
from flask import Flask, jsonify
from flask_cors import CORS
from youtube_search import YoutubeSearch
app = Flask(__name__)
CORS(app)

@app.route('/get-video/<name>/<int:ep>')
def get_video(name, ep):
    try:
        # We search for the specific episode, not the trailer ID
        query = f"{name} episode {ep} english sub"
        
        # max_results=1 ensures we just get the best match
        results = YoutubeSearch(query, max_results=1).to_dict()
        
        if results:
            # We return the unique video ID (which will be different from the trailer ID)
            return jsonify({"youtube_id": results[0]['id']})
        
        return jsonify({"error": "No episode found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#anime episodes list show
@app.route('/get-episodes/<id>')
def get_episodes(id):
    raw_data = requests.get(f"https://api.jikan.moe/v4/anime/{id}/episodes")
    return raw_data.json()

#top anime
@app.route('/top-anime')
def get_top():
    url = "https://api.jikan.moe/v4/top/anime"
    response = requests.get(url)
    return jsonify(response.json().get('data', []))
#search 
@app.route('/search/<query>')
def search_anime(query):
    url = f"https://api.jikan.moe/v4/anime?q={query}&limit=20"
    response = requests.get(url)
    return jsonify(response.json().get('data', []))

#top get anime
@app.route('/get-anime')
def get_anime():
    url = "https://api.jikan.moe/v4/seasons/now" 
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return jsonify(data.get('data', []))
        else:
            print(f"API Error: {response.status_code}")
            return jsonify([])
            
    except Exception as e:
        print(f"Connection Error: {e}")
        return jsonify([])

if __name__ == '__main__':
    app.run(port=5000, debug=True)