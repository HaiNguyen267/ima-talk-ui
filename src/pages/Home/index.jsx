import "./style.scss";
import React from "react";
import Sidebar from "../../components/Sidebar";
import Chat from "../../components/Chat";
import { directConversationListData, groupConversationListData, messages, notifiationListData } from '../../utils/data.js'
import ConversationContext from '../../contexts/ConversationContext';
import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import axios from "axios";
import UserContext from "../../contexts/UserContext";
import LoadingContext from "../../contexts/LoadingContext";
import SockJS from 'sockjs-client';
import { over } from 'stompjs';
import ModalContainer from "../../components/Modal/ModalContainer";
import UserProfileModal from "../../components/Modal/UserProfileModal";
import ModalContext from "../../contexts/ModalContext";

export default function () {



    const { user, token } = useContext(UserContext);


    const [conversationList, setConversationList] = useState();
    const [chatbox, setChatbox] = useState({
        conversationId: null,
        conversationName: null,
        conversationAvatar: null,
        memberMap: {}, // this is a map of users, key is the user id, value is the user object
        messageMap: {}, // this is a map of messages, key is the message id, value is the message object (for easy access)
        messageList: [], // this is the list of messages, used to display the messages in the chat box
    });
    const [activeConversation, setActiveConversation] = useState(); // this is the active conversation info on the sidebar
    const [notificationList, setNotificationList] = useState([]);

    // i use this ref to store the active conversation id, because it is used in a callback function
    // and so that i can access the up-to-date value of the active conversation id
    const activeConversationId = useRef(null);
    activeConversationId.current = activeConversation ? activeConversation.id : null;

    const [friendList, setFriendList] = useState([]);
    const [friendRequestList, setFriendRequestList] = useState([]);

    const stompJsClient = useRef(null);
    const [showModal, setShowModal] = useState(false);
    const [modalChildren, setModalChildren] = useState();

    useEffect(() => {
        if (user) {
            fetchFriendRequestList();
            fetchFriendList();
            fetchConversationList();
            fetchNotificationList();
        }

    }, [user])

    useEffect(() => {
        connectWebSocket();

        return () => {
            closeWebSocketConnection();
        }
    }, [user])


    useEffect(() => {
        if (activeConversation) {
            fetchConversationChatHistory();
            // connectWebSocket();

            // return () => {
            //     closeWebSocketConnection();
            // }
        }
    }, [activeConversation])



    const connectWebSocket = async () => {
        let Sock = new SockJS(`${process.env.REACT_APP_BACKEND_WEBSOCKET_URL}/ws`);
        stompJsClient.current = over(Sock);
        await stompJsClient.current.connect({}, onConnected, onError);

    }

    const onConnected = () => {
        if (stompJsClient.current && stompJsClient.current.connected && user) {

            stompJsClient.current.subscribe(`/topic/user/${user.id}`, onReceivedMessage);



            // send a message to that user to notify that the user is online
            // stompJsClient.current.send("/app/user/online", {}, JSON.stringify({ id: user.id }));
        }
    }

    const onError = (err) => {
        // displayPopup("Something went wrong!", "Connect to server failed!, please contact the admin!", true)
    }


    const closeWebSocketConnection = () => {
        if (stompJsClient.current && stompJsClient.current.connected) {
            stompJsClient.current.disconnect();
        }
    }


    const onReceivedMessage = useCallback((payload) => {
        let event = JSON.parse(payload.body);
        if (event.name == "NEW_MESSAGE") {
            const newMessage = event.data
            if (newMessage.conversationId == activeConversationId.current) {
                // update the chat box when user is opening the conversation
                updateChatbox(newMessage)

                // 
            }

            // update the sidebar
            updateSidebar(newMessage);

        } else if (event.name == "NEW_CONVERSATION") {
            const conversation = event.data;
            console.log("wow i have a new conversation");
            setConversationList(prev => {
                return [conversation, ...prev];
            })
        } else if (event.name == "NEW_FRIEND") {
            const friend = event.data;
            setFriendList(prev => {
                return [friend, ...prev];
            })
        } else if (event.name == "NEW_FRIEND_REQUEST") {
            const friendRequest = event.data;
            setFriendRequestList(prev => {
                return [friendRequest, ...prev];
            })
        } else if (event.name == "NEW_NOTIFICATION") {
            const notification = event.data;
            setNotificationList(prev => {
                return [notification, ...prev];
            })
        }


    }, [activeConversation])

    const updateChatbox = (newMessage) => {
        setChatbox(prev => {
            return {
                ...prev,
                messageList: [...prev.messageList, newMessage],
                messageMap: { ...prev.messageMap, [newMessage.id]: newMessage }
            }
        })

        // send a signal to the server to notify that the message is seen by the user
        // stompJsClient.current.send("/app/message-seen", {}, JSON.stringify({ id: user.id, conversationId: activeConversation.id }));
    }

    const updateSidebar = (newMessage) => {
        setConversationList(prev => {
            // find the conversation to update
            let conversationToUpdate = prev.find(conversation => conversation.id === newMessage.conversationId);
            conversationToUpdate.lastMessage = newMessage;
            conversationToUpdate.unread = true; // for new message, set the unread to true

            // if the user is openning the conversation, all new messages of that conversation will be set to be read
            if (conversationToUpdate.id === activeConversationId.current) {
                conversationToUpdate.unread = false;
            }

            // move the conversation to the top of the list
            prev = prev.filter(conversation => conversation.id !== conversationToUpdate.id);
            return [conversationToUpdate, ...prev];
        })
    }


    const fetchConversationList = async () => {
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }


        setConversationList([1, 2, 3, 4, 5, 6, 7, 8]) // this is for rendering the loading skeleton when sending request to the server
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/chat/conversation-list`, header);
        const responseData = response.data.data;

        setConversationList(responseData.conversations);
        const currentConversation = responseData.conversations.find(c => c.id === responseData.currentConversationId)
        setActiveConversation(currentConversation);
        if (!currentConversation) {
            setChatbox({
                renderGreetingChat: true
            }); // this is when new user login, there is no active conversation, so we render the greeting conversation
        }
    }

    const fetchNotificationList = async () => {
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }


        setNotificationList([1, 2, 3, 4, 5, 6, 7, 8]) // this is for rendering the loading skeleton when sending request to the server
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/notification/all`, header);
        const responseData = response.data.data;
        setNotificationList(responseData);
        // setNotificationList(currentConversatin);
    }


    const fetchFriendList = async () => {
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        setFriendList([1, 2, 3, 4, 5, 6, 7, 8]) // this is for rendering the loading skeleton when sending request to the server
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/friends`, header);
        const responseData = response.data.data;
        setFriendList(responseData);

    }


    const fetchFriendRequestList = async () => {
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        setFriendRequestList([1, 2, 3, 4, 5, 6, 7, 8]) // this is for rendering the loading skeleton when sending request to the server
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/friend-request`, header);
        setFriendRequestList(response.data.data);
    }

    const fetchSidebar = async () => {
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/sidebar`, header);
        const sidebar = response.data.data;


        setConversationList(sidebar.conversations);
        // set the active conversation to be the current conversation that user was recently in
        const currentConversation = sidebar.conversations.find(c => c.id === sidebar.currentConversationId)
        setActiveConversation(currentConversation);
    }

    const fetchConversationChatHistory = async () => {

        if (!activeConversation) {
            // if there is no active conversation, do nothing
            // setLoadingChatbox(false);
            return;
        }
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/chat/conversation-chat-history?conversationId=${activeConversation.id}`, header);

        const chatbox = response.data.data;
        setChatbox(chatbox);
    }



    const handleClickConversation = (id) => {
        const conversation = conversationList.find(conversation => conversation.id === id);
        setActiveConversation(conversation);
        // setActiveConversation();
        //TODO: make this code cleaner (both backend and frontend)
        // loop through the conversation list and set the unread to false
        setConversationList(prev => {
            return prev.map(conversation => {
                if (conversation.id === id) {
                    conversation.unread = false;
                }
                return conversation;
            })
        })
    }


    const handleAcceptFriendRequest = async (id) => {
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/accept-friend?requestId=${id}`, {}, header)
        // if accept friend request successfully, fetch friend request list and friend list again
        if (response.data.status == 200) {

            fetchFriendList();
            fetchFriendRequestList();
        }
    }

    const handleSeeAllNotifications = async () => {
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/notification/see-all-notifications`, {}, header);
        if (response.data.status === 200) {
            // setNotificationList(prev => {
            //     return prev.map(notification => {
            //         return {
            //             ...notification,
            //             unread: false
            //         }
            //     })

            // })
        }

    }

    const addNewMessage = (message) => {
        // update the chatbox
        updateChatbox(message);

        // update the sidebar
        updateSidebar(message);
    }


    return (
        <ModalContext.Provider value={{ setShowModal, setModalChildren }}>
            <ConversationContext.Provider
                value={{
                    activeConversation,
                    setActiveConversation,
                }}>
                <div className="Home">
                    <Sidebar
                        conversationList={conversationList}
                        handleClickConversation={handleClickConversation}
                        notificationList={notificationList}
                        friendList={friendList}
                        friendRequestList={friendRequestList}
                        handleAcceptFriendRequest={handleAcceptFriendRequest}
                        handleSeeAllNotifications={handleSeeAllNotifications}
                    // loading={loadingSidebar}
                    />
                    <Chat
                        chatbox={chatbox}
                        addNewMessage={addNewMessage}
                        setChatbox={setChatbox}
                    />
                    <ModalContainer
                        showModal={showModal}
                        children={<UserProfileModal />}
                        onClose={() => setShowModal(false)}
                    />
                </div>

            </ConversationContext.Provider >
        </ModalContext.Provider>


    )
}

//TODO: use variable to store numberic values for CSS properties