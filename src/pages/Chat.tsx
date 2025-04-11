import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Add uuid for temp IDs

interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  _id?: string; // Server-provided ID
  tempId?: string; // Temporary ID for optimistic messages
}

interface Contact {
  id: string;
  username: string;
  avatar: string;
}

export default function Chat() {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🔹 Connected to chat server');
      newSocket.emit('authenticate', token);
    });

    newSocket.on('newMessage', (message: Message) => {
      console.log('🔹 Received new message:', message);
      if (
        (message.senderId === user.id && message.receiverId === selectedContact?.id) ||
        (message.receiverId === user.id && message.senderId === selectedContact?.id)
      ) {
        setMessages((prev) => {
          // Replace optimistic message with server message
          const tempIdx = prev.findIndex((m) => m.tempId && m.content === message.content && !m._id);
          if (tempIdx !== -1) {
            const newMessages = [...prev];
            newMessages[tempIdx] = { ...message, tempId: prev[tempIdx].tempId };
            console.log('🔹 Replaced optimistic message:', newMessages);
            return newMessages;
          }
          // Add if not a duplicate
          if (message._id && prev.some((m) => m._id === message._id)) {
            return prev;
          }
          console.log('🔹 Added new message:', [...prev, message]);
          return [...prev, message];
        });
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
    });

    setSocket(newSocket);

    const fetchContacts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('🔹 Fetched contacts:', response.data);
        setContacts(response.data);
      } catch (error) {
        console.error('❌ Error fetching contacts:', error);
      }
    };
    fetchContacts();

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, selectedContact]);

  useEffect(() => {
    if (!selectedContact || !token) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${selectedContact.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('🔹 Fetched messages for', selectedContact.username, ':', response.data);
        setMessages(response.data); // Overwrite with server data
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [selectedContact, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !messageInput || !selectedContact || !user) return;
    const messageData = { receiverId: selectedContact.id, content: messageInput };
    console.log('🔹 Sending message:', messageData);

    // Optimistic update with tempId
    const optimisticMessage: Message = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      tempId: uuidv4(), // Unique temp ID
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    socket.emit('sendMessage', messageData);
    setMessageInput('');
  };

  if (!user) return <div className="text-gray-400 text-center">Please log in to chat</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-700 flex">
        <div className="w-1/3 border-r border-gray-700 pr-4">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Contacts</h2>
          <div className="overflow-y-auto h-96">
            {contacts.length === 0 ? (
              <p className="text-gray-400">No contacts found</p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                    selectedContact?.id === contact.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-100'
                  }`}
                >
                  <img src={contact.avatar} alt={contact.username} className="h-8 w-8 rounded-full" />
                  <span>{contact.username}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="w-2/3 pl-4 flex flex-col">
          <h2 className="text-xl font-bold text-gray-100 mb-4">
            {selectedContact ? `Chat with ${selectedContact.username}` : 'Select a contact to chat'}
          </h2>
          <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-900/80 rounded-lg border border-gray-700">
            {selectedContact ? (
              messages.length === 0 ? (
                <p className="text-gray-400">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id || msg.tempId} // Use _id or tempId
                    className={`mb-2 p-2 rounded-lg ${
                      msg.senderId === user.id ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-700 text-gray-100'
                    }`}
                    style={{ maxWidth: '70%' }}
                  >
                    <p>{msg.content}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )
            ) : null}
            <div ref={messagesEndRef} />
          </div>
          {selectedContact && (
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-2 bg-gray-700 text-gray-100 rounded-lg"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// import { useState, useEffect, useRef } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import io, { Socket } from 'socket.io-client';
// import axios from 'axios';
// import { Send } from 'lucide-react';

// interface Message {
//   senderId: string;
//   receiverId: string;
//   content: string;
//   timestamp: string;
// }

// interface Contact {
//   id: string;
//   username: string;
//   avatar: string;
// }

// export default function Chat() {
//   const { user, token } = useAuth();
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [messageInput, setMessageInput] = useState('');
//   const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!token || !user) return;

//     const newSocket = io(import.meta.env.VITE_API_URL, {
//         auth: { token },
//         transports: ['websocket', 'polling'], // Ensure WebSocket is preferred
//       });

//     newSocket.on('connect', () => {
//       console.log('🔹 Connected to chat server');
//       newSocket.emit('authenticate', token);
//     });

//     newSocket.on('newMessage', (message: Message) => {
//       console.log('🔹 Received new message:', message);
//       // Only add if it’s part of the current chat
//       if (
//         (message.senderId === user.id && message.receiverId === selectedContact?.id) ||
//         (message.receiverId === user.id && message.senderId === selectedContact?.id)
//       ) {
//         setMessages((prev) => {
//           // Avoid duplicates
//           if (prev.some((m) => m.content === message.content && m.timestamp === message.timestamp)) {
//             return prev;
//           }
//           return [...prev, message];
//         });
//       }
//     });

//     newSocket.on('connect_error', (err) => {
//         console.error('❌ Connection error:', err.message); // Log connection issues
//       });

//     setSocket(newSocket);

//     const fetchContacts = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('🔹 Fetched contacts:', response.data);
//         setContacts(response.data);
//       } catch (error) {
//         console.error('❌ Error fetching contacts:', error);
//       }
//     };
//     fetchContacts();

//     return () => {
//       newSocket.disconnect();
//     };
//   }, [token, user, selectedContact]); // Add selectedContact to deps to re-filter messages

//   useEffect(() => {
//     if (!selectedContact || !token) return;

//     const fetchMessages = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${selectedContact.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('🔹 Fetched messages for', selectedContact.username, ':', response.data);
//         setMessages(response.data);
//       } catch (error) {
//         console.error('❌ Error fetching messages:', error);
//       }
//     };
//     fetchMessages();
//   }, [selectedContact, token]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!socket || !messageInput || !selectedContact || !user) return;
//     const messageData = { receiverId: selectedContact.id, content: messageInput };
//     console.log('🔹 Sending message:', messageData);

//     // Optimistically add the message to the UI
//     const optimisticMessage: Message = {
//       senderId: user.id,
//       receiverId: selectedContact.id,
//       content: messageInput,
//       timestamp: new Date().toISOString(),
//     };
//     setMessages((prev) => [...prev, optimisticMessage]);
//     socket.emit('sendMessage', messageData);
//     setMessageInput('');
//   };

//   if (!user) return <div className="text-gray-400 text-center">Please log in to chat</div>;

//   return (
//     <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
//       <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-700 flex">
//         <div className="w-1/3 border-r border-gray-700 pr-4">
//           <h2 className="text-xl font-bold text-gray-100 mb-4">Contacts</h2>
//           <div className="overflow-y-auto h-96">
//             {contacts.length === 0 ? (
//               <p className="text-gray-400">No contacts found</p>
//             ) : (
//               contacts.map((contact) => (
//                 <div
//                   key={contact.id}
//                   onClick={() => setSelectedContact(contact)}
//                   className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
//                     selectedContact?.id === contact.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-100'
//                   }`}
//                 >
//                   <img src={contact.avatar} alt={contact.username} className="h-8 w-8 rounded-full" />
//                   <span>{contact.username}</span>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//         <div className="w-2/3 pl-4 flex flex-col">
//           <h2 className="text-xl font-bold text-gray-100 mb-4">
//             {selectedContact ? `Chat with ${selectedContact.username}` : 'Select a contact to chat'}
//           </h2>
//           <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-900/80 rounded-lg border border-gray-700">
//             {selectedContact ? (
//               messages.length === 0 ? (
//                 <p className="text-gray-400">No messages yet</p>
//               ) : (
//                 messages.map((msg, idx) => (
//                   <div
//                     key={idx}
//                     className={`mb-2 p-2 rounded-lg ${
//                       msg.senderId === user.id ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-700 text-gray-100'
//                     }`}
//                     style={{ maxWidth: '70%' }}
//                   >
//                     <p>{msg.content}</p>
//                     <span className="text-xs text-gray-400">
//                       {new Date(msg.timestamp).toLocaleTimeString()}
//                     </span>
//                   </div>
//                 ))
//               )
//             ) : null}
//             <div ref={messagesEndRef} />
//           </div>
//           {selectedContact && (
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={messageInput}
//                 onChange={(e) => setMessageInput(e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//                 placeholder="Type a message..."
//                 className="flex-1 p-2 bg-gray-700 text-gray-100 rounded-lg"
//               />
//               <button
//                 onClick={sendMessage}
//                 className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
//               >
//                 <Send className="h-5 w-5" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
