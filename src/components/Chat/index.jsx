import "./style.scss";
import React, { useState, useContext, useRef, useEffect } from "react";
import Message from "../Message";
import ReplyMessageContext from "../../contexts/ReplyMessageContext";
import ReplyTo from "../Message/ReplyTo";
import ReplyToInputFooter from "./ReplyToInputFooter";
import ConversationContext from "../../contexts/ConversationContext";
import UserContext from "../../contexts/UserContext";
import axios from "axios";
import SockJS from 'sockjs-client';
import { over } from 'stompjs';
import LoadingContext from "../../contexts/LoadingContext";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import Logo from '../../assests/images/dsy-logo.png'
import GreetingChat from "./GreetingChat";
import ModalContainer from "../Modal/ModalContainer";
export default function ({ chatbox, addNewMessage, setChatbox }) {

    // const { chatbox } = useContext(ConversationContext);
    // const chatbox = null;
    const { user, token } = useContext(UserContext);
    const { setLoading } = useContext(LoadingContext);
    const inputBoxRef = useRef(null);
    const inputContainerRef = useRef(null);
    const textareaHeight = useState(45)

    const chatBodyRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [repliedMessage, setRepliedMessage] = useState(null);

    const [showWallpaperModal, setShowWallpaperModal] = useState(false);
    const [showChatColorModal, setShowChatColorModal] = useState(false);
    const [showDefaultReactionModal, setShowDefaultReactionModal] = useState(false);

    // when user click outside the emoji picker, close the emoji picker
    useEffect(() => {
        function handleClickOutside(event) {
            console.log("click outside");
            // console.log(inputBoxRef.current);
            // console.log("=", inputBoxRef.current?.contains(event.target));
            if (inputContainerRef.current && !inputContainerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [])

    useEffect(() => {
        // set the height of the textarea to fit the content
        // max is 100px
        // when the user delete all the text, set the height back to 40px
        if (userInput.trim() == "") {
            console.log("WOW: 40px");
            inputBoxRef.current.style.height = "40px";
            return
        }

        inputBoxRef.current.style.height = `${Math.min(inputBoxRef.current.scrollHeight, 200)}px`;


    }, [userInput])

    // Scroll to the bottom when the component mounts or when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [chatbox]); // This will trigger when messages change

    // Function to scroll to the bottom of the chat body
    function scrollToBottom() {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }



    const parseThemColor = () => {
        if (!chatbox || !chatbox.conversationSetting) return ""

        // API return the colo in format: "COLOR-1", "COLOR-2", "COLOR-3"
        const themeColor = chatbox.conversationSetting.themeColor;

        if (themeColor == null || themeColor.length == 0) return "";

        return themeColor.toLowerCase();
    }


    const parseWallpaper = () => {
        if (!chatbox || !chatbox.conversationSetting) return ""

        // API return the wallpaper in format: "NO-WALLPAPER", "WALLPAPER-1", "WALLPAPER-2"
        const wallpaper = chatbox.conversationSetting.wallpaper;

        if (wallpaper == null || wallpaper.length == 0) return "";

        return wallpaper.toLowerCase();
    }

    const parseDefaultReaction = () => {

        if (!chatbox || !chatbox.conversationSetting) return ""
        // API return the default reaction in format: "LIKE", "LOVE", "HAHA"
        const defaultReaction = chatbox.conversationSetting.defaultReaction;

        if (defaultReaction == null || defaultReaction.length == 0) return "LIKE";

        return defaultReaction;


    }

    //TODO: write function to parse them
    const themeColorStyle = parseThemColor();
    const wallpaperStyle = parseWallpaper();
    const defaultReactionStyle = parseDefaultReaction();

    const handleUserInput = () => {
        if (userInput.trim() == "") return;
        console.log("user input: ", userInput);

        // the tempId is used to identify the message in the message list before it is sent to the server and saved to the database
        const newMessage = {
            id: null,
            tempId: Math.random().toString(36).substring(7),
            senderId: user.id,
            messageType: "TEXT",
            conversationId: chatbox.conversationId,
            content: userInput,
            repliedMessageId: repliedMessage?.id,
            status: "sending",
        }

        // set the input box back to empty 
        setUserInput('');
        addNewMessage(newMessage);

        // if user is replying to a message, clear the replied message
        if (repliedMessage) {
            setRepliedMessage(null);

        }

        sendMessageToServer(newMessage);
    }

    const handlerClickDefaultReaction = () => {
        // the tempId is used to identify the message in the message list before it is sent to the server and saved to the database
        const newMessage = {
            id: null,
            tempId: Math.random().toString(36).substring(7),
            senderId: user.id,
            messageType: "DEFAULT_REACTION",
            conversationId: chatbox.conversationId,
            content: defaultReactionStyle,
            repliedMessageId: repliedMessage,
            status: "sending",
        }

        // set the input box back to empty 
        setUserInput('');
        addNewMessage(newMessage);

        // if user is replying to a message, clear the replied message
        if (repliedMessage) {
            setRepliedMessage(null);

        }

        sendMessageToServer(newMessage);
    }


    const sendMessageToServer = async (message) => {
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        const body = {
            conversationId: message.conversationId,
            content: message.content,
            messageType: message.messageType,
            repliedMessageId: message.repliedMessageId,
            tempId: message.tempId
        }

        // add new message to the list

        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat/send-message`, body, header)
        console.log("response: ", response);
        if (response.data.status == 200) {
            // update the message with the id from the server
            // const data = response.data;
            // update the tempurary message on the state with the message from the server
            updateSentMessage(response.data.data);
        }
    }




    // clean the code, create a state for message array


    function getMessageSender(message) {
        const senderId = message.senderId;
        return chatbox.memberMap[senderId];
    }

    function getPreviousMessage(index) {
        if (index == 0) return null;
        return chatbox.messageList[index - 1];
    }

    function getNextMessage(index) {
        if (index == chatbox.messageList.length - 1) return null;
        return chatbox.messageList[index + 1];
    }

    function getMessageById(id) {
        return chatbox.messageMap[id];
    }

    const toggleShowEmojiPicker = () => {
        setShowEmojiPicker(val => !val);
    }

    const handleEmojiSelect = (emoji) => {
        setUserInput(val => val + emoji.native);
        console.log("user input: ", userInput + emoji.native);

        inputBoxRef.current.focus();
        // setShowEmojiPicker(false);
    }

    const updateSentMessage = (data) => {
        const tempId = data.tempId;
        const createdAt = data.createdAt;
        const messageNo = data.messageNo;
        const id = data.id;


        // update the message created and status for the t

        setChatbox(prev => {
            return {
                ...prev,
                messageList: prev.messageList.map(m => {
                    if (m.tempId === tempId) {
                        return {
                            ...m,
                            id: id,
                            createdAt: createdAt,
                            messageNo: messageNo,
                            status: "sent"
                        };
                    }

                    return m
                }),
            }
        })
    }


    const handleUpdateChatTheme = async (theme) => {

        //TODO: make a request
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        const body = {
            conversationId: chatbox.conversationId,
            themeColor: theme,
        }

        setShowChatColorModal(false)

        // add new message to the list
        setLoading(true)
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat/update-conversation-setting`, body, header)
        console.log("response: ", response);
        setLoading(false)

        if (response.data.status == 200) {
            setChatbox(prev => {
                return {
                    ...prev,
                    conversationSetting: {
                        ...prev.conversationSetting,
                        themeColor: theme
                    }
                }
            })
        }
    }

    const handleUpdateWallpaper = async (image) => {

        //TODO: make a request
        //TODO: make a request
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        const body = {
            conversationId: chatbox.conversationId,
            wallpaper: image,
        }

        // add new message to the list
        setShowWallpaperModal(false)

        setLoading(true)
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat/update-conversation-setting`, body, header)
        setLoading(false)

        console.log("response: ", response);
        if (response.data.status == 200) {
            setChatbox(prev => {
                return {
                    ...prev,
                    conversationSetting: {
                        ...prev.conversationSetting,
                        wallpaper: image
                    }
                }
            })
        }
    }


    const handleDefaultReaction = async (reaction) => {

        //TODO: make a request
        //TODO: make a request
        if (!token) return null;
        const header = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        const body = {
            conversationId: chatbox.conversationId,
            defaultReaction: reaction,
        }

        // add new message to the list
        setShowDefaultReactionModal(false)

        setLoading(true)
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chat/update-conversation-setting`, body, header)
        setLoading(false)

        if (response.data.status == 200) {
            setChatbox(prev => {
                return {
                    ...prev,
                    conversationSetting: {
                        ...prev.conversationSetting,
                        defaultReaction: reaction
                    }
                }
            })
        }
    }



    // const style = (loading) ? "skeleton-Chat" : "";
    const style = (!chatbox.conversationName && !chatbox.conversationAvatar) ? "skeleton-Chat" : "";

    // if (!chatbox.conversationName && !chatbox.conversationAvatar) {

    //     return <GreetingChat />
    // }

    if (chatbox.renderGreetingChat) {
        return <GreetingChat

            userAvatar={user.avatar}
            userDisplayName={user.displayName}
        />
    }

    return (
        <ReplyMessageContext.Provider value={{ repliedMessage, setRepliedMessage, inputBoxRef }}>
            <div className={`Chat ${style}`}>
                <div className="chat-area">
                    <div className="chat-header">
                        <div className="info">
                            <div className="avatar">
                                <img src={chatbox.conversationAvatar} alt="" />
                            </div>
                            <div className="name">{chatbox.conversationName}</div>
                        </div>

                        <div className="btn-container">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <i class="fa-solid fa-video"></i>
                            <i class="fa-solid fa-phone"></i>
                            <i class="fa-solid fa-info"></i>

                        </div>

                    </div>
                    <div className={`chat-body ${wallpaperStyle}`} ref={chatBodyRef}>

                        <div className="message-container">

                            {
                                chatbox.messageList.length > 0 ?
                                    chatbox.messageList.map((message, index) => {
                                        const isMe = message.senderId === user.id;
                                        const previousMessage = getPreviousMessage(index)
                                        const nextMessage = getNextMessage(index)
                                        const sender = getMessageSender(message)
                                        const repliedMessage = message.repliedMessage;

                                        return (
                                            <Message
                                                isMe={isMe}
                                                repliedMessage={repliedMessage}
                                                seenAvatar={null} // skip this for now
                                                isSeen={false} // skip this for now
                                                isSent={false} // skip this for
                                                previousMessage={previousMessage}
                                                sender={sender}
                                                message={message}
                                                nextMessage={nextMessage}
                                                colorThemeStyle={themeColorStyle}
                                            />
                                        )


                                    })

                                    :
                                    <div className="no-message">
                                        {/* <img src={Logo} alt="" /> */}
                                        <p className="bold">Start a conversation now</p>
                                    </div>
                            }


                        </div>

                    </div>

                    <div className="chat-footer">
                        {repliedMessage &&
                            <ReplyToInputFooter {...repliedMessage}
                            />
                        }


                        <div className="input-container" ref={inputContainerRef}>
                            <div className="input-box">
                                <i class="fa-regular fa-face-smile" onClick={toggleShowEmojiPicker}></i>
                                <textarea
                                    ref={inputBoxRef}
                                    type="text"
                                    placeholder="Type a message..."
                                    value={userInput}
                                    onChange={e => {
                                        // remove all the new line character at the beginning of the string
                                        let value = e.target.value;
                                        value = value.replace(/^\n+/, "");
                                        setUserInput(value);
                                    }}
                                    onKeyDown={e => {
                                        // if user presses shift + enter, do nothing
                                        if (e.key == "Enter" && !e.shiftKey) {
                                            handleUserInput();
                                        }
                                    }}
                                />

                                {
                                    showEmojiPicker &&
                                    <div className="emoji-picker">
                                        <Picker data={data}
                                            onEmojiSelect={handleEmojiSelect}
                                            theme={"light"}
                                            emojiSize={20}

                                        // onClickOutside={() => {
                                        //     if (sho)
                                        // }}
                                        />
                                    </div>
                                }

                                <i class="fa-regular fa-paper-plane" onClick={handleUserInput}></i>

                            </div>

                            <div className="default-emoji" onClick={handlerClickDefaultReaction}>

                                {defaultReactionStyle == "LIKE" && <i class="fa-solid fa-thumbs-up like"></i>}
                                {defaultReactionStyle == "LOVE" && <i class="fa-solid fa-heart heart"></i>}
                                {defaultReactionStyle == "HAHA" && <i class="fa-solid fa-face-smile smile"></i>}

                            </div>

                        </div>


                    </div>
                </div>

                <div className="right-sidebar">
                    <div className="profile">
                        <img className='avatar' src={chatbox.conversationAvatar} alt='' />
                        <div className="name">{chatbox.conversationName}</div>
                        <div className="chat-type">{chatbox.groupConversation ? 'Group' : "Friend"}</div>
                    </div>

                    <div className="info">
                        <div className="email"><span className="bold">Email: </span>Loremipsum@test.com</div>
                        <div className="phone"><span className="bold">Phone: </span>0123456789</div>
                        <div className="city"><span className="bold">City: </span>Hanoi</div>
                        <div className="country"><span className="bold">Country: </span>Vietnam</div>
                    </div>

                    <div className="action-container">
                        <div className="bold action">Edit nickname</div>
                        <div className="bold action" onClick={() => setShowChatColorModal(true)}>Change chat theme color <p className={`color-circle ${themeColorStyle}`}></p></div>
                        <div className="bold action" onClick={() => setShowWallpaperModal(true)}>Change chat wallpaper</div>
                        <div className="bold action" onClick={() => setShowDefaultReactionModal(true)}>Change default reaction</div>
                        <div className="bold action block-contact-btn">Block Contact</div>
                    </div>
                </div>
                {/* <div className="right-sidebar">
                    <div className="profile">
                        <img className='avatar' src="https://images.unsplash.com/photo-1699694927074-cb6a828dd255?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxMDh8fHxlbnwwfHx8fHw%3D" alt='' />
                        <div className="name">User Display Name</div>
                        <div className="chat-type">Group</div>
                    </div>

                    <div className="member-list">
                        <p className="bold">Member List</p>
                        <div className="member">
                            <img className="avatar" src="https://plus.unsplash.com/premium_photo-1699389000894-8e99c0e31bf3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw3fHx8ZW58MHx8fHx8" alt="" />
                            <div className="member_info">
                                <div className="name">John Doe</div>
                                <div className="role">Admin</div>
                            </div>
                        </div>
                        <div className="member">
                            <img className="avatar" src="https://plus.unsplash.com/premium_photo-1699389000894-8e99c0e31bf3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw3fHx8ZW58MHx8fHx8" alt="" />
                            <div className="member_info">
                                <div className="name">John Doe</div>
                                <div className="role">Admin</div>
                            </div>
                        </div>
                        <div className="member">
                            <img className="avatar" src="https://plus.unsplash.com/premium_photo-1699389000894-8e99c0e31bf3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw3fHx8ZW58MHx8fHx8" alt="" />
                            <div className="member_info">
                                <div className="name">John Doe</div>
                                <div className="role">Admin</div>
                            </div>
                        </div>
                        <div className="member">
                            <img className="avatar" src="https://plus.unsplash.com/premium_photo-1699389000894-8e99c0e31bf3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw3fHx8ZW58MHx8fHx8" alt="" />
                            <div className="member_info">
                                <div className="name">John Doe</div>
                                <div className="role">Admin</div>
                            </div>
                        </div>
                    </div>

                    <div className="action-container">
                        <div className="bold action">Change chat theme color <p className="color-circle"></p></div>
                        <div className="bold action">Change chat background</div>
                        <div className="bold action">Change default react emoji</div>
                        <div className="bold action block-contact-btn">Leave Group</div>
                    </div>
                </div> */}
            </div>


            <ModalContainer
                showModal={showChatColorModal}
                children={<ChooseChatColorModal onClickColor={handleUpdateChatTheme} />}
                onClose={() => setShowChatColorModal(false)}
            />

            <ModalContainer
                showModal={showWallpaperModal}
                children={<ChooseWallpaperModal onClickWallpaper={handleUpdateWallpaper} />}
                onClose={() => setShowWallpaperModal(false)}
            />

            <ModalContainer
                showModal={showDefaultReactionModal}
                children={<ChooseDefaultReactionModal onClickDefaultReaction={handleDefaultReaction} />}
                onClose={() => setShowDefaultReactionModal(false)}
            />


        </ReplyMessageContext.Provider>

    )
}


function ChooseChatColorModal({ onClickColor }) {
    return (
        <div className="ChooseChatColorModal">

            <div className="title bold">Pick a color</div>

            <div className="grid-container">
                <div className="chat-color chat-color-1" onClick={() => onClickColor("CHAT-COLOR-1")}></div>
                <div className="chat-color chat-color-2" onClick={() => onClickColor("CHAT-COLOR-2")}></div>
                <div className="chat-color chat-color-3" onClick={() => onClickColor("CHAT-COLOR-3")}></div>
                <div className="chat-color chat-color-4" onClick={() => onClickColor("CHAT-COLOR-4")}></div>
                <div className="chat-color chat-color-5" onClick={() => onClickColor("CHAT-COLOR-5")}></div>
                <div className="chat-color chat-color-6" onClick={() => onClickColor("CHAT-COLOR-6")}></div>
                <div className="chat-color chat-color-7" onClick={() => onClickColor("CHAT-COLOR-7")}></div>
                <div className="chat-color chat-color-8" onClick={() => onClickColor("CHAT-COLOR-8")}></div>
            </div>

        </div>
    )
}
function ChooseWallpaperModal({ onClickWallpaper }) {
    return (
        <div className="ChooseWallpaperModal">

            <div className="title bold">Pick a wallpaper</div>

            <div className="grid-container">
                <div className="wallpaper no-wallpaper-item" onClick={() => onClickWallpaper("NO-WALLPAPER")}>No wallpaper</div>
                <div className="wallpaper wallpaper-1" onClick={() => onClickWallpaper("WALLPAPER-1")}></div>
                <div className="wallpaper wallpaper-2" onClick={() => onClickWallpaper("WALLPAPER-2")}></div>
                <div className="wallpaper wallpaper-3" onClick={() => onClickWallpaper("WALLPAPER-3")}></div>
                <div className="wallpaper wallpaper-4" onClick={() => onClickWallpaper("WALLPAPER-4")}></div>
                <div className="wallpaper wallpaper-5" onClick={() => onClickWallpaper("WALLPAPER-5")}></div>
            </div>

        </div>
    )
}
function ChooseDefaultReactionModal({ onClickDefaultReaction }) {
    return (
        <div className="ChooseDefaultReactionModal">

            <div className="title bold">Pick a reaction</div>

            <div className="grid-container">
                <div className="default-reaction default-reaction-1" onClick={() => onClickDefaultReaction("LIKE")}>
                    <i class="fa-solid fa-thumbs-up like"></i>
                    <p className="defaul-reaction-text like bold">LIKE</p>
                </div>
                <div className="default-reaction default-reaction-1" onClick={() => onClickDefaultReaction("LOVE")}>
                    <i class="fa-solid fa-heart heart"></i>
                    <p className="defaul-reaction-text heart bold">LOVE</p>
                </div>
                <div className="default-reaction default-reaction-1" onClick={() => onClickDefaultReaction("HAHA")}>
                    <i class="fa-solid fa-face-smile smile"></i>
                    <p className="defaul-reaction-text smile bold">HAHA</p>
                </div>
            </div>

        </div>
    )
}

