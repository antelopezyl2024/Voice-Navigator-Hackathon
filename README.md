###Backend Setup (Python RAG)  
  cd backend
  
  python3 -m venv venv
  source venv/bin/activate
  
  pip install -r requirements.txt
  
  export GROQ_API_KEY=your_api_key
  
  bash start.sh

###Frontend Setup (Expo)
  cd frontend
  
  npm install
  npx expo install expo-av
  npx expo install react-dom react-native-web
  
  npx expo start -c

###Android Emulator
  npx expo run:android  

###API Endpoints
POST /query
POST /query/dmv
POST /query/food
  
