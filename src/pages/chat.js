import React, { useState, useEffect, useRef } from "react"; // add useRef
import axios from "axios";
import styles from "../styles/chat.module.css";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const messageListRef = useRef(null); // add this line

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const botResponse = await axios.post("/api/bot", {
        query: message,
      });

      setConversation([
        ...conversation,
        { by: "user", text: message },
        { by: "bot", text: botResponse.data.text },
      ]);

      setMessage("");
    } catch (error) {
      console.error("Error while fetching bot response", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [conversation]);

  return (
    <div className={styles.chatContainer}>
      <h1>Chat with Quran Scholar</h1>

      <ul className={styles.messageList} ref={messageListRef}>
        {conversation.map((message, index) => (
          <li
            key={index}
            className={
              message.by === "user" ? styles.userMessage : styles.botMessage
            }
          >
            <strong>{message.by}: </strong> {message.text}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          className={styles.chatInput}
        />
        <button type="submit" disabled={loading} className={styles.chatButton}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default Chat;
