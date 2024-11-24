import React, { useState, useEffect, useRef } from "react";
import { auth, firestore, provider } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null); // Reference for auto-scrolling

  // Effect to manage user authentication state
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch messages from Firestore when user changes
  useEffect(() => {
    if (user) {
      const messagesRef = collection(firestore, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map((doc) => doc.data()));
      });

      return () => unsubscribeMessages();
    } else {
      setMessages([]); // Clear messages if no user is signed in
    }
  }, [user]); // Run this effect whenever the user changes

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSignIn = () => signInWithPopup(auth, provider);
  const handleSignOut = () => {
    signOut(auth).then(() => {
      setMessages([]); // Clear messages when user logs out
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    // Ensure user is authenticated before sending a message
    if (user) {
      const messagesRef = collection(firestore, "messages");
      await addDoc(messagesRef, {
        text: newMessage,
        uid: user.uid,
        displayName: user.displayName,
        timestamp: new Date(),
      });

      setNewMessage("");
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Chat App</h1>
        {user ? (
          <button onClick={handleSignOut}>Sign Out</button>
        ) : (
          <button onClick={handleSignIn}>Sign In with Google</button>
        )}
      </header>
      <div className="chat-box">
        <div className="messages">
          {user && messages.map((msg, index) => (
            <div key={index} className={`message ${msg.uid === user?.uid ? "sent" : "received"}`}>
              <p className="username"><strong>{msg.displayName}</strong></p>
              <p className="text">{msg.text}</p>
            </div>
          ))}
          {/* Reference element for scrolling */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {user && (
        <form onSubmit={sendMessage} className="send-message-form">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
            <button type="button" className="mic-button">🎤</button>
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
}

export default App;
