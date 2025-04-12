import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { Send, Check, CheckCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

interface Message {
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  _id?: string;
  tempId?: string;
  status?: 'sent' | 'delivered';
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
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user?.id) return;

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
          const tempIdx = prev.findIndex((m) => m.tempId && m.content === message.content && !m._id);
          if (tempIdx !== -1) {
            const newMessages = [...prev];
            newMessages[tempIdx] = { ...message, tempId: prev[tempIdx].tempId, status: 'delivered' };
            console.log('🔹 Replaced optimistic message:', newMessages);
            return newMessages;
          }
          if (message._id && prev.some((m) => m._id === message._id)) {
            return prev;
          }
          console.log('🔹 Added new message:', [...prev, message]);
          return [...prev, message];
        });
      } else if (message.receiverId === user.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.senderId]: (prev[message.senderId] || 0) + 1,
        }));
      }
    });

    newSocket.on('typing', (data) => {
      if (data.senderId === selectedContact?.id && data.receiverId === user.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
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
  }, [token, user?.id, selectedContact]);

  useEffect(() => {
    if (!selectedContact || !token || !user?.id) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${selectedContact.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('🔹 Fetched messages for', selectedContact.username, ':', response.data);
        setMessages(response.data);
        setUnreadCounts((prev) => ({ ...prev, [selectedContact.id]: 0 }));
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [selectedContact, token, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !messageInput || !selectedContact || !user?.id) return;
    const messageData = { receiverId: selectedContact.id, content: messageInput };
    console.log('🔹 Sending message:', messageData);

    const optimisticMessage: Message = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      tempId: uuidv4(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    socket.emit('sendMessage', messageData);
    setMessageInput('');
  };

  const handleTyping = () => {
    if (socket && selectedContact && user?.id) {
      socket.emit('typing', { senderId: user.id, receiverId: selectedContact.id });
    }
  };

  const openProfile = (username: string) => {
    navigate(`/user/${username}`); // Navigate to new UserProfile route
  };

  if (!user?.id) return <div className="text-gray-400 text-center">Please log in to chat</div>;

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
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer ${
                    selectedContact?.id === contact.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-100'
                  }`}
                >
                  <div
                    className="flex items-center gap-2 relative group"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfile(contact.username);
                    }}
                  >
                    <img
                      src={contact.avatar}
                      alt={contact.username}
                      className="h-8 w-8 rounded-full cursor-pointer hover:opacity-75 transition-opacity"
                    />
                    <span className="cursor-pointer hover:underline">{contact.username}</span>
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded -top-8 left-0">
                      View profile
                    </span>
                  </div>
                  {unreadCounts[contact.id] > 0 && (
                    <span className="bg-red-600 text-white rounded-full px-2 py-1 text-xs">
                      {unreadCounts[contact.id]}
                    </span>
                  )}
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
              <>
                {messages.length === 0 ? (
                  <p className="text-gray-400">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id || msg.tempId}
                      className={`mb-2 p-2 rounded-lg flex items-end gap-1 ${
                        msg.senderId === user.id ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-700 text-gray-100'
                      }`}
                      style={{ maxWidth: '70%' }}
                    >
                      <p>{msg.content}</p>
                      {msg.senderId === user.id && (
                        <span className="text-gray-400">
                          {msg.status === 'delivered' ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
                {isTyping && (
                  <p className="text-gray-400 text-sm italic">{selectedContact.username} is typing...</p>
                )}
              </>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
          {selectedContact && (
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
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
// import { Send, Check, CheckCheck } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid';

// interface Message {
//   senderId: string;
//   receiverId: string;
//   content: string;
//   timestamp: string;
//   _id?: string;
//   tempId?: string;
//   status?: 'sent' | 'delivered';
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
//   const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
//   const [isTyping, setIsTyping] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!token || !user?.id) return;

//     const newSocket = io(import.meta.env.VITE_API_URL, {
//       auth: { token },
//       transports: ['websocket', 'polling'],
//     });

//     newSocket.on('connect', () => {
//       console.log('🔹 Connected to chat server');
//       newSocket.emit('authenticate', token);
//     });

//     newSocket.on('newMessage', (message: Message) => {
//       console.log('🔹 Received new message:', message);
//       if (
//         (message.senderId === user.id && message.receiverId === selectedContact?.id) ||
//         (message.receiverId === user.id && message.senderId === selectedContact?.id)
//       ) {
//         setMessages((prev) => {
//           const tempIdx = prev.findIndex((m) => m.tempId && m.content === message.content && !m._id);
//           if (tempIdx !== -1) {
//             const newMessages = [...prev];
//             newMessages[tempIdx] = { ...message, tempId: prev[tempIdx].tempId, status: 'delivered' };
//             console.log('🔹 Replaced optimistic message:', newMessages);
//             return newMessages;
//           }
//           if (message._id && prev.some((m) => m._id === message._id)) {
//             return prev;
//           }
//           console.log('🔹 Added new message:', [...prev, message]);
//           return [...prev, message];
//         });
//       } else if (message.receiverId === user.id) {
//         setUnreadCounts((prev) => ({
//           ...prev,
//           [message.senderId]: (prev[message.senderId] || 0) + 1,
//         }));
//       }
//     });

//     newSocket.on('typing', (data) => {
//       if (data.senderId === selectedContact?.id && data.receiverId === user.id) {
//         setIsTyping(true);
//         setTimeout(() => setIsTyping(false), 2000);
//       }
//     });

//     newSocket.on('connect_error', (err) => {
//       console.error('❌ Connection error:', err.message);
//     });

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
//   }, [token, user?.id, selectedContact]);

//   useEffect(() => {
//     if (!selectedContact || !token || !user?.id) return;

//     const fetchMessages = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/${selectedContact.id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('🔹 Fetched messages for', selectedContact.username, ':', response.data);
//         setMessages(response.data);
//         setUnreadCounts((prev) => ({ ...prev, [selectedContact.id]: 0 }));
//       } catch (error) {
//         console.error('❌ Error fetching messages:', error);
//       }
//     };
//     fetchMessages();
//   }, [selectedContact, token, user?.id]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!socket || !messageInput || !selectedContact || !user?.id) return;
//     const messageData = { receiverId: selectedContact.id, content: messageInput };
//     console.log('🔹 Sending message:', messageData);

//     const optimisticMessage: Message = {
//       senderId: user.id,
//       receiverId: selectedContact.id,
//       content: messageInput,
//       timestamp: new Date().toISOString(),
//       tempId: uuidv4(),
//       status: 'sent',
//     };
//     setMessages((prev) => [...prev, optimisticMessage]);
//     socket.emit('sendMessage', messageData);
//     setMessageInput('');
//   };

//   const handleTyping = () => {
//     if (socket && selectedContact && user?.id) {
//       socket.emit('typing', { senderId: user.id, receiverId: selectedContact.id });
//     }
//   };

//   const openProfile = (username: string) => {
//     window.open(`https://github.com/${username}`, '_blank');
//   };

//   if (!user?.id) return <div className="text-gray-400 text-center">Please log in to chat</div>;

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
//                   className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer ${
//                     selectedContact?.id === contact.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-100'
//                   }`}
//                 >
//                   <div
//                     className="flex items-center gap-2 relative group"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       openProfile(contact.username);
//                     }}
//                   >
//                     <img
//   src={contact.avatar}
//   alt={contact.username}
//   className="h-8 w-8 rounded-full cursor-pointer hover:opacity-75 transition-opacity"
// />

//                     <span className="cursor-pointer hover:underline">{contact.username}</span>
//                     <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded -top-8 left-0">
//                       View GitHub profile
//                     </span>
//                   </div>
//                   {unreadCounts[contact.id] > 0 && (
//                     <span className="bg-red-600 text-white rounded-full px-2 py-1 text-xs">
//                       {unreadCounts[contact.id]}
//                     </span>
//                   )}
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
//               <>
//                 {messages.length === 0 ? (
//                   <p className="text-gray-400">No messages yet</p>
//                 ) : (
//                   messages.map((msg) => (
//                     <div
//                       key={msg._id || msg.tempId}
//                       className={`mb-2 p-2 rounded-lg flex items-end gap-1 ${
//                         msg.senderId === user.id ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-700 text-gray-100'
//                       }`}
//                       style={{ maxWidth: '70%' }}
//                     >
//                       <p>{msg.content}</p>
//                       {msg.senderId === user.id && (
//                         <span className="text-gray-400">
//                           {msg.status === 'delivered' ? (
//                             <CheckCheck className="h-3 w-3" />
//                           ) : (
//                             <Check className="h-3 w-3" />
//                           )}
//                         </span>
//                       )}
//                       <span className="text-xs text-gray-400 ml-1">
//                         {new Date(msg.timestamp).toLocaleTimeString()}
//                       </span>
//                     </div>
//                   ))
//                 )}
//                 {isTyping && (
//                   <p className="text-gray-400 text-sm italic">{selectedContact.username} is typing...</p>
//                 )}
//               </>
//             ) : null}
//             <div ref={messagesEndRef} />
//           </div>
//           {selectedContact && (
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={messageInput}
//                 onChange={(e) => {
//                   setMessageInput(e.target.value);
//                   handleTyping();
//                 }}
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
