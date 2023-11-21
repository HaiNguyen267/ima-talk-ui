import "./style.scss";
import React from "react";
import ReplyIcon from "../../assests/images/reply.png"
import ReplyMessageContext from "../../contexts/ReplyMessageContext";
import MessageStatus from "./MessageStatus";
import ReplyTo from "./ReplyTo";
import { formatTime } from "../../utils/Utils";


function findTimeDifferenceMessages(message1, message2) {
    // if message is last message, return 0
    if (message1 && message2) {
        return timeDifferenceInMinutes(message1.createdAt, message2.createdAt)
    }

    return 0;

}


// Function to calculate the time difference between two dates in minutes
function timeDifferenceInMinutes(date1, date2) {
    const differenceInMilliseconds = Math.abs(new Date(date1) - new Date(date2));
    const differenceInMinutes = differenceInMilliseconds / (1000 * 60);

    return differenceInMinutes;
}

function checkIfSentBySameUser(message1, message2) {
    if (message1 && message2) {
        return message1.senderId == message2.senderId
    }
    return false;
}

function getHideAvatarStyle(isMe, message, previousMessage) {

    if (isMe) return " hide-avatar";

    const sentBySameUserAsPreviousMessage = checkIfSentBySameUser(message, previousMessage);
    if (sentBySameUserAsPreviousMessage) {
        return " hide-avatar";
    }

    return " "

}

function getMarginTopStyle(message, previousMessage) {
    const timeDifferentWithPreviousMessage = findTimeDifferenceMessages(message, previousMessage);
    // diplays the message closed to the previous message if the time difference is small
    if (timeDifferentWithPreviousMessage < 1) {
        return " margin-top-1";
    } else if (timeDifferentWithPreviousMessage < 5) {
        return " margin-top-3";
    } else if (timeDifferentWithPreviousMessage < 30) {
        return " margin-top-5";
    } else {
        return " margin-top-10";
    }
}
function getHideTimeStyle(message, nextMessage) {


    // check if the message is the last message
    const isLastMessage = !nextMessage;
    if (isLastMessage) {
        return " "; // show time if it is the last message
    }

    // if there is a next message, check if the sender is different with the next message
    const differentSenderWithNextMessage = !checkIfSentBySameUser(message, nextMessage);
    if (differentSenderWithNextMessage) {
        return " "; // show time if the next message is sent by a different user
    }

    // if the next message is sent the same user, check the time difference
    const timeDifferentWithNextMessage = findTimeDifferenceMessages(message, nextMessage);
    if (timeDifferentWithNextMessage > 30) {
        return " "; // show time if the time difference with the next message is more than 30 minutes
    }

    return " hide-time" // otherwise, hide the time

}




export default function ({ isMe, message, sender, previousMessage, nextMessage, isSent, isSeen, seenAvatar, repliedMessage, colorThemeStyle }) {

    console.log("colorThemeStyle: ", colorThemeStyle);
    let style = ''

    style += isMe ? " right" : " left"
    style += getHideAvatarStyle(isMe, message, previousMessage);
    style += getHideTimeStyle(message, nextMessage);
    style += getMarginTopStyle(message, previousMessage);

    const formattedTime = formatTime(message.createdAt);
    const { setRepliedMessage, inputBoxRef } = React.useContext(ReplyMessageContext);


    const handleReplyClick = () => {
        console.log("handleReplyClick", message);
        setRepliedMessage({
            id: message.id,
            senderName: sender.displayName,
            messageType: "TEXT",
            messageContent: message.content
        });
        inputBoxRef.current.focus();
    }

    return (
        <div className={`Message ${style} `} title={formattedTime}>
            <div className="avatar">
                <p className="display-name">{sender.displayName}</p>
                <img src={sender.avatar} alt="" />
            </div>
            <div className="message-detail">
                <ReplyTo repliedMessage={repliedMessage} />
                <MessageComponent
                    messageType={message.messageType}
                    messageContent={message.content}
                    colorThemeStyle={isMe ? colorThemeStyle : ''}
                />
                {
                    message.status == 'sending' && <div className="sending-status">Sending...</div>
                }

                {
                    formattedTime && <div className="time-and-status">
                        <div className="time">{formattedTime}</div>
                        {<MessageStatus isMe={isMe} seenAvatar={seenAvatar} isSent={isSent} isSeen={isSeen} />}
                    </div>


                }




            </div>
            {
                !isMe && <div className="reply-btn">
                    <img src={ReplyIcon} alt="" onClick={handleReplyClick} />
                </div>
            }
        </div>
    )
}

function MessageComponent({ messageType, messageContent, colorThemeStyle }) {
    console.log("messageType", messageType);
    if (messageType == 'DEFAULT_REACTION') {
        console.log("WOWOWOW");
        return <div className={`message-default-reaction`}>
            {messageContent == "LIKE" ? <i class="fa-solid fa-thumbs-up like"></i>
            : messageContent == "LOVE" ? <i class="fa-solid fa-heart heart"></i>
            : messageContent == "HAHA" ? <i class="fa-solid fa-face-smile smile"></i>
            : null
            }   
        </div>;
    }

    const contentWithNewLines = messageContent.split('\n').map((line, index) => (
        <React.Fragment key={index}>
            {line}
            <br />
        </React.Fragment>
    ));

    return <div className={`message-text ${colorThemeStyle}`}>{contentWithNewLines}</div>;
}
