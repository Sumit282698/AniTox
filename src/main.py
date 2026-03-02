import requests
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
#testing
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